import { MockActivityEnvironment } from '@temporalio/testing';
import { ApplicationFailure } from '@temporalio/activity';
import { describe, it } from 'mocha';
import assert from 'assert';
import OpenAI from 'openai';
import { createActivities } from '../activities';
import { OPENROUTER_BASE_URL, OpenRouterRequest, OpenRouterResult } from '../shared';

type FakeResponse = { status: number; body: unknown; headers?: Record<string, string> };

/** Activities backed by a fake OpenRouter; no network, no API key. */
function makeActivities(respond: (request: Request) => FakeResponse, seen: Request[] = []) {
  const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    seen.push(request);
    const { status, body, headers } = respond(request);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    });
  };
  const client = new OpenAI({ baseURL: OPENROUTER_BASE_URL, apiKey: 'test-key', maxRetries: 0, fetch });
  return createActivities(client);
}

const request: OpenRouterRequest = {
  prompt: 'Explain retries in one sentence.',
  model: 'openrouter/auto',
  costTier: 'low',
  cacheTtlSeconds: 600,
  failOnceAfterCall: false,
};

function completion(cost: number | undefined = 0.000123, model = 'openai/gpt-4o-mini') {
  return {
    id: 'gen-123',
    object: 'chat.completion',
    created: 0,
    model,
    choices: [
      { index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Retries repeat a failed call.' } },
    ],
    usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12, cost },
  };
}

async function expectFailure(fn: () => Promise<unknown>): Promise<ApplicationFailure> {
  try {
    await fn();
  } catch (e) {
    assert.ok(e instanceof ApplicationFailure, `expected ApplicationFailure, got ${String(e)}`);
    return e;
  }
  assert.fail('expected the activity to throw');
}

describe('callOpenRouter activity', () => {
  it('returns model, cost, and cache status, with one HTTP call per attempt', async () => {
    const seen: Request[] = [];
    const activities = makeActivities(
      () => ({ status: 200, body: completion(), headers: { 'X-OpenRouter-Cache-Status': 'MISS' } }),
      seen,
    );

    const result = (await new MockActivityEnvironment().run(activities.callOpenRouter, request)) as OpenRouterResult;

    assert.deepStrictEqual(result, {
      prompt: request.prompt,
      model: 'openai/gpt-4o-mini',
      answer: 'Retries repeat a failed call.',
      costUsd: 0.000123,
      generationId: 'gen-123',
      cacheStatus: 'MISS',
    });
    assert.strictEqual(seen.length, 1);
    const body = (await seen[0].json()) as { model: string; plugins: unknown };
    assert.strictEqual(body.model, 'openrouter/auto');
    assert.deepStrictEqual(body.plugins, [{ id: 'auto-router', cost_tier: 'low' }]);
    assert.strictEqual(seen[0].headers.get('x-openrouter-cache'), 'true');
    assert.strictEqual(seen[0].headers.get('x-openrouter-cache-ttl'), '600');
  });

  it('treats 429 as retryable and honors Retry-After', async () => {
    const activities = makeActivities(() => ({
      status: 429,
      body: { error: { code: 429, message: 'Rate limited' } },
      headers: { 'Retry-After': '7' },
    }));
    const failure = await expectFailure(() => new MockActivityEnvironment().run(activities.callOpenRouter, request));
    assert.strictEqual(failure.type, 'OpenRouterHTTP429');
    assert.strictEqual(failure.nonRetryable, false);
    assert.strictEqual(failure.nextRetryDelay, '7s');
  });

  it('treats 402 insufficient credits as non-retryable', async () => {
    const activities = makeActivities(() => ({
      status: 402,
      body: { error: { code: 402, message: 'Insufficient credits' } },
    }));
    const failure = await expectFailure(() => new MockActivityEnvironment().run(activities.callOpenRouter, request));
    assert.strictEqual(failure.type, 'OpenRouterHTTP402');
    assert.strictEqual(failure.nonRetryable, true);
    assert.match(failure.message, /Insufficient credits/);
  });

  it('classifies an error body inside a 200 by its code', async () => {
    const activities = makeActivities(() => ({
      status: 200,
      body: { error: { code: 403, message: 'Flagged by moderation' } },
    }));
    const failure = await expectFailure(() => new MockActivityEnvironment().run(activities.callOpenRouter, request));
    assert.strictEqual(failure.type, 'OpenRouterHTTP403');
    assert.strictEqual(failure.nonRetryable, true);
  });

  it('with failOnceAfterCall, fails the first attempt only', async () => {
    const activities = makeActivities(() => ({
      status: 200,
      body: completion(0),
      headers: { 'X-OpenRouter-Cache-Status': 'HIT' },
    }));
    const failOnce = { ...request, failOnceAfterCall: true };

    const failure = await expectFailure(() => new MockActivityEnvironment().run(activities.callOpenRouter, failOnce));
    assert.strictEqual(failure.type, 'SimulatedFailure');
    assert.strictEqual(failure.nonRetryable, false);

    const result = (await new MockActivityEnvironment({ attempt: 2 }).run(
      activities.callOpenRouter,
      failOnce,
    )) as OpenRouterResult;
    assert.strictEqual(result.cacheStatus, 'HIT');
    assert.strictEqual(result.costUsd, 0);
  });

  it('reports a missing cost as zero', async () => {
    const body = completion();
    delete (body.usage as { cost?: number }).cost;
    const activities = makeActivities(() => ({ status: 200, body }));
    const result = (await new MockActivityEnvironment().run(activities.callOpenRouter, request)) as OpenRouterResult;
    assert.strictEqual(result.costUsd, 0);
    assert.strictEqual(result.cacheStatus, '');
  });
});
