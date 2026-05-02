/**
 * Unit tests for the triage activity's tool registry.
 *
 * Drives the registry directly with `MockProvider.runLoop`, bypassing
 * `agenticSession` (which would require a real Anthropic client). Asserts
 * that the agent's tool-call sequence produces the expected final result.
 *
 * No API keys, no Temporal, no shell exec, no MCP HTTP. All stubbed via
 * the injected `TriageDeps`.
 */
import { describe, it } from 'mocha';
import assert from 'node:assert';
import {
  MockProvider,
  ResponseBuilder,
  type MockResponse,
  type Message,
} from '@temporalio/tool-registry';
import { buildTriageRegistry, type TriageDeps } from '../activities/triage';
import type { AlertPayload, ApprovalResponse } from '../types';

const ALERT: AlertPayload = {
  status: 'firing',
  labels: { alertname: 'HighLatencyP99', service: 'api', runbook: 'rollback-or-scale' },
  annotations: {
    summary: "P99 latency on api > 1s",
    description: 'P99 above threshold for 1m.',
  },
  startsAt: new Date().toISOString(),
};

function makeDeps(overrides: Partial<TriageDeps> = {}): TriageDeps {
  return {
    mcpListTools: async (baseUrl) =>
      baseUrl.includes('7071')
        ? [
            {
              name: 'prometheus_query',
              description: 'instant PromQL query',
              inputSchema: {
                type: 'object',
                properties: { query: { type: 'string' } },
                required: ['query'],
              },
            },
          ]
        : [
            {
              name: 'kubectl_describe',
              description: 'describe a k8s resource',
              inputSchema: {
                type: 'object',
                properties: {
                  resource: { type: 'string' },
                  name: { type: 'string' },
                  namespace: { type: 'string' },
                },
                required: ['resource', 'name'],
              },
            },
          ],
    mcpCallTool: async (_url, name, args) => `(mocked ${name} ${JSON.stringify(args)})`,
    requestHumanApproval: async () => ({ decision: 'approved', reason: 'default-mock' }),
    execShellCommand: async (cmd) => ({ stdout: `(mocked exec: ${cmd})`, stderr: '' }),
    ...overrides,
  };
}

async function drive(
  deps: TriageDeps,
  script: MockResponse[]
): Promise<{ result: any; mcpResults: unknown[] }> {
  const session = { results: [] as unknown[] };
  const { registry, getResult } = await buildTriageRegistry(ALERT, session, deps);
  const provider = new MockProvider(script);
  const messages: Message[] = [{ role: 'user', content: 'test prompt' }];
  await provider.runLoop(messages, registry);
  return { result: getResult(), mcpResults: session.results };
}

describe('buildTriageRegistry — happy path', () => {
  it('investigate, propose, approve, execute, report_resolved', async () => {
    let approvalCalls = 0;
    const deps = makeDeps({
      requestHumanApproval: async () => {
        approvalCalls++;
        return { decision: 'approved', reason: 'go ahead' };
      },
    });
    const action = 'kubectl rollout restart deploy/api -n demo-app';

    const { result, mcpResults } = await drive(deps, [
      ResponseBuilder.toolCall('prometheus_query', { query: "up{service='api'}" }),
      ResponseBuilder.toolCall('kubectl_describe', {
        resource: 'pod',
        name: 'api-xyz',
        namespace: 'demo-app',
      }),
      ResponseBuilder.toolCall('propose_remediation', {
        action,
        justification: 'leak; restart reclaims memory',
      }),
      ResponseBuilder.toolCall('request_human_approval', {
        message: 'Restart api?',
        diagnosis: 'memory leak',
        proposedAction: action,
      }),
      ResponseBuilder.toolCall('execute_remediation', { action }),
      ResponseBuilder.toolCall('report_resolved', { summary: 'restarted; latency normal' }),
      ResponseBuilder.done('done'),
    ]);

    assert.strictEqual(result.status, 'resolved');
    assert.match(result.summary, /restart/);
    assert.strictEqual(result.remediations.length, 1);
    assert.strictEqual(result.remediations[0].action, action);
    assert.strictEqual(approvalCalls, 1);
    const kinds = mcpResults.map((r: any) => r.kind);
    assert.deepStrictEqual(kinds, ['remediation', 'approval', 'executed', 'final']);
  });
});

describe('buildTriageRegistry — rejected approval', () => {
  it("agent reports unresolved with operator's reason", async () => {
    const deps = makeDeps({
      requestHumanApproval: async (): Promise<ApprovalResponse> => ({
        decision: 'rejected',
        reason: 'off-hours; defer until tomorrow',
      }),
    });

    const { result, mcpResults } = await drive(deps, [
      ResponseBuilder.toolCall('propose_remediation', {
        action: 'kubectl scale ...',
        justification: 'transient',
      }),
      ResponseBuilder.toolCall('request_human_approval', {
        message: 'Scale?',
        diagnosis: 'transient',
        proposedAction: 'kubectl scale ...',
      }),
      ResponseBuilder.toolCall('report_unresolved', { summary: 'operator deferred' }),
      ResponseBuilder.done('done'),
    ]);

    assert.strictEqual(result.status, 'unresolved');
    assert.match(result.summary, /deferred/);
    const approval = mcpResults.find((r: any) => r.kind === 'approval') as any;
    assert.strictEqual(approval?.decision, 'rejected');
    assert.match(approval?.reason ?? '', /off-hours/);
  });
});

describe('buildTriageRegistry — guard rails', () => {
  it('execute_remediation refuses without prior approval', async () => {
    const deps = makeDeps();
    const { result } = await drive(deps, [
      ResponseBuilder.toolCall('execute_remediation', { action: 'rm -rf /' }),
      ResponseBuilder.toolCall('report_unresolved', { summary: 'tried to skip approval' }),
      ResponseBuilder.done('done'),
    ]);
    assert.strictEqual(result.status, 'unresolved');
  });

  it('execute_remediation refuses when action does not match approved one', async () => {
    let executedCmd: string | null = null;
    const deps = makeDeps({
      requestHumanApproval: async () => ({ decision: 'approved', reason: 'ok' }),
      execShellCommand: async (cmd) => {
        executedCmd = cmd;
        return { stdout: 'ran', stderr: '' };
      },
    });

    const { result } = await drive(deps, [
      ResponseBuilder.toolCall('propose_remediation', {
        action: 'kubectl restart api',
        justification: 'x',
      }),
      ResponseBuilder.toolCall('request_human_approval', {
        message: 'Restart?',
        diagnosis: 'x',
        proposedAction: 'kubectl restart api',
      }),
      ResponseBuilder.toolCall('execute_remediation', {
        action: 'kubectl scale deploy/api --replicas=10',
      }),
      ResponseBuilder.toolCall('report_unresolved', { summary: 'guard tripped' }),
      ResponseBuilder.done('done'),
    ]);

    assert.strictEqual(result.status, 'unresolved');
    assert.strictEqual(
      executedCmd,
      null,
      "execShellCommand should not have been called when action didn't match"
    );
  });
});

describe('buildTriageRegistry — MCP integration', () => {
  it('registers tools fetched from both MCP sidecars', async () => {
    const deps = makeDeps();
    const session = { results: [] as unknown[] };
    const { registry } = await buildTriageRegistry(ALERT, session, deps);
    const anthropic = registry.toAnthropic();
    const names = anthropic.map((t) => t.name);
    for (const expected of [
      'prometheus_query',
      'kubectl_describe',
      'propose_remediation',
      'request_human_approval',
      'execute_remediation',
      'report_resolved',
      'report_unresolved',
    ]) {
      assert.ok(names.includes(expected), `expected ${expected} in registry`);
    }
  });

  it('forwards MCP tool dispatch back to the sidecar', async () => {
    const calls: { url: string; name: string; args: any }[] = [];
    const deps = makeDeps({
      mcpCallTool: async (url, name, args) => {
        calls.push({ url, name, args });
        return `result for ${name}`;
      },
    });

    await drive(deps, [
      ResponseBuilder.toolCall('prometheus_query', { query: 'up{}' }),
      ResponseBuilder.toolCall('report_unresolved', { summary: 'test' }),
      ResponseBuilder.done('done'),
    ]);

    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0]?.name, 'prometheus_query');
    assert.deepStrictEqual(calls[0]?.args, { query: 'up{}' });
    assert.match(calls[0]?.url ?? '', /7071/);
  });
});
