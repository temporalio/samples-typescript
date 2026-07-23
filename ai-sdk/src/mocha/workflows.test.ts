import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { haikuAgent } from '../workflows';
import * as activities from '../activities';
import { AiSdkPlugin } from '@temporalio/ai-sdk';
import assert from 'assert';

// `@ai-sdk/openai` is ESM-only. Under this sample's CommonJS build a static
// `import` is emitted as `require()`, which throws on Node 22's require(ESM)
// implementation ("Unexpected module status 0") at module-load time — aborting
// the whole mocha run. Load it lazily via a native dynamic `import()` (wrapped
// in `new Function` so TypeScript doesn't down-level it back to `require`),
// inside `before` so it only runs when this suite isn't skipped.
const importESM = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<typeof import('@ai-sdk/openai')>;

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
const describeWorkflow = hasOpenAIKey ? describe : describe.skip;

describeWorkflow(
  hasOpenAIKey ? 'Example workflow' : 'Example workflow (skipped: OPENAI_API_KEY is not set)',
  function () {
    this.timeout(30_000);

    let testEnv: TestWorkflowEnvironment;
    let openai: (typeof import('@ai-sdk/openai'))['openai'];

    before(async () => {
      testEnv = await TestWorkflowEnvironment.createLocal();
      ({ openai } = await importESM('@ai-sdk/openai'));
    });

    after(async () => {
      await testEnv?.teardown();
    });

    it('successfully completes the Workflow', async () => {
      const { client, nativeConnection } = testEnv;
      const taskQueue = 'test';

      const worker = await Worker.create({
        connection: nativeConnection,
        plugins: [new AiSdkPlugin({ modelProvider: openai })],
        taskQueue,
        workflowsPath: require.resolve('../workflows'),
        activities,
      });

      const result = await worker.runUntil(
        client.workflow.execute(haikuAgent, {
          args: ['Temporal'],
          workflowId: 'test',
          taskQueue,
        }),
      );
      assert.ok(result.length > 0);
    });
  },
);
