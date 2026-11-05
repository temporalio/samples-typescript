import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin, SandboxClientProvider } from '@temporalio/openai-agents';
import { UnixLocalSandboxClient } from '@openai/agents-core/sandbox/local';
import assert from 'assert';
import { FakeModelProvider, textResponse, toolCallResponse, toolOutputs } from './fake-model';
import { sandboxWorkflow } from '../workflows';

const SECRET_VAR = 'SANDBOX_SERVICE_TOKEN';
const SECRET = `sandbox-sample-secret-${Date.now()}`;

describe('openai-agents/sandboxes workflow scenarios', function () {
  this.timeout(60_000);

  let testEnv: TestWorkflowEnvironment;
  let previousSecret: string | undefined;

  before(async function () {
    if (process.platform === 'win32') {
      this.skip();
    }
    previousSecret = process.env[SECRET_VAR];
    process.env[SECRET_VAR] = SECRET;
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    if (previousSecret === undefined) {
      delete process.env[SECRET_VAR];
    } else {
      process.env[SECRET_VAR] = previousSecret;
    }
    await testEnv?.teardown();
  });

  function createWorker(taskQueue: string, provider: FakeModelProvider) {
    return Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: provider,
          sandboxClientProviders: [new SandboxClientProvider('local', new UnixLocalSandboxClient())],
          resolvableWorkerEnvVars: [SECRET_VAR],
        }),
      ],
      bundlerOptions: {
        webpackConfigHook: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            conditionNames: ['require', 'browser', 'default'],
          },
        }),
      },
    });
  }

  function historyText(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
    if (Array.isArray(value)) return value.map(historyText).join('\n');
    if (value && typeof value === 'object') return Object.values(value).map(historyText).join('\n');
    return String(value);
  }

  it('sandboxWorkflow: creates the sandbox, runs each command, and tears it down as Activities', async () => {
    const taskQueue = 'test-sandboxes-lifecycle-' + Date.now();
    const workflowId = 'test-sandboxes-lifecycle-' + Date.now();
    const provider = new FakeModelProvider([
      toolCallResponse('exec_command', { cmd: "printf 'alpha\\nbeta\\ngamma\\n' > notes.txt" }),
      toolCallResponse('exec_command', { cmd: 'tail -n 1 notes.txt' }),
      textResponse('The last line of notes.txt is gamma.'),
    ]);

    const worker = await createWorker(taskQueue, provider);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(sandboxWorkflow, {
        args: ['Write three lines to notes.txt, then show me the last one.'],
        workflowId,
        taskQueue,
      }),
    );

    assert.strictEqual(result, 'The last line of notes.txt is gamma.');
    const history = await testEnv.client.workflow.getHandle(workflowId).fetchHistory();
    const activities = (history.events ?? [])
      .map((event) => event.activityTaskScheduledEventAttributes?.activityType?.name ?? '')
      .filter((name) => name.startsWith('local-sandbox-'));
    assert.strictEqual(activities[0], 'local-sandbox-client-create');
    assert.deepStrictEqual(
      activities.filter((name) => name.endsWith('-exec-command')),
      ['local-sandbox-session-exec-command', 'local-sandbox-session-exec-command'],
    );
    assert.strictEqual(activities[activities.length - 1], 'local-sandbox-session-delete');
    assert.match(toolOutputs(provider.model, 'exec_command')[1]!, /Process exited with code 0.*gamma/);
  });

  it('sandboxWorkflow: resolves SERVICE_TOKEN on the Worker and keeps its value out of history', async () => {
    const taskQueue = 'test-sandboxes-secret-' + Date.now();
    const workflowId = 'test-sandboxes-secret-' + Date.now();
    const provider = new FakeModelProvider([
      toolCallResponse('exec_command', { cmd: 'echo "SERVICE_TOKEN has ${#SERVICE_TOKEN} characters"' }),
      textResponse('SERVICE_TOKEN is set.'),
    ]);

    const worker = await createWorker(taskQueue, provider);
    const result = await worker.runUntil(
      testEnv.client.workflow.execute(sandboxWorkflow, {
        args: ['Check whether SERVICE_TOKEN is set, without printing it.'],
        workflowId,
        taskQueue,
      }),
    );

    assert.strictEqual(result, 'SERVICE_TOKEN is set.');
    assert.match(toolOutputs(provider.model, 'exec_command')[0]!, new RegExp(`has ${SECRET.length} characters`));
    const history = historyText(await testEnv.client.workflow.getHandle(workflowId).fetchHistory());
    assert.ok(history.includes(SECRET_VAR), 'the Worker variable name should appear in history');
    assert.ok(!history.includes(SECRET), 'the resolved value must not appear in history');
  });

  it('sandboxWorkflow: a running process handle does not survive a Worker restart', async () => {
    const taskQueue = 'test-sandboxes-restart-' + Date.now();
    const workflowId = 'test-sandboxes-restart-' + Date.now();
    const beforeRestart = new FakeModelProvider([
      toolCallResponse('exec_command', { cmd: 'sleep 3', yield_time_ms: 100 }),
    ]);
    const afterRestart = new FakeModelProvider([
      toolCallResponse('write_stdin', { session_id: 1, chars: '' }),
      textResponse('The running process was lost when the Worker restarted.'),
    ]);

    const handle = await testEnv.client.workflow.start(sandboxWorkflow, {
      args: ['Start a slow command, then check on it.'],
      workflowId,
      taskQueue,
    });

    const firstWorker = await createWorker(taskQueue, beforeRestart);
    await firstWorker.runUntil(beforeRestart.model.exhausted);
    const secondWorker = await createWorker(taskQueue, afterRestart);
    const result = await secondWorker.runUntil(handle.result());

    assert.strictEqual(result, 'The running process was lost when the Worker restarted.');
    assert.match(toolOutputs(beforeRestart.model, 'exec_command')[0]!, /Process running with session ID 1/);
    assert.match(toolOutputs(afterRestart.model, 'write_stdin')[0]!, /write_stdin failed: session not found: 1/);
  });
});
