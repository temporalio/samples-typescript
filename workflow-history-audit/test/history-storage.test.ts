import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  atomicWrite,
  readHistoryEnvelope,
  readRunAnalysis,
  type HistoryEnvelope,
  type RunAnalysis,
} from '../src/internal/history-storage.js';

const metadata = { namespace: 'test', workflowId: 'workflow-1', runId: 'run-1', taskQueue: 'example-queue' };
const history: HistoryEnvelope = { kind: 'workflow-history', formatVersion: 1, ...metadata, history: { events: [] } };
const analysis: RunAnalysis = { kind: 'run-analysis', formatVersion: 1, ...metadata, extractions: {} };

void test('reads tagged v1 history and analysis envelopes', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-history-audit-'));
  try {
    const file = path.join(root, 'record.json');
    await atomicWrite(file, JSON.stringify(history));
    assert.deepEqual(await readHistoryEnvelope(file), history);
    await atomicWrite(file, JSON.stringify(analysis));
    assert.deepEqual(await readRunAnalysis(file), analysis);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('uses the discriminator even when both payload properties are present', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-history-audit-'));
  try {
    const file = path.join(root, 'record.json');
    await atomicWrite(file, JSON.stringify({ ...history, extractions: {} }));
    await assert.rejects(readRunAnalysis(file), /Invalid run-analysis v1 envelope/);
    await atomicWrite(file, JSON.stringify({ ...analysis, history: { events: [] } }));
    await assert.rejects(readHistoryEnvelope(file), /Invalid workflow-history v1 envelope/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('rejects untagged records, unsupported versions, and unknown kinds', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-history-audit-'));
  try {
    const file = path.join(root, 'record.json');
    for (const record of [
      { formatVersion: 1, ...metadata, history: { events: [] }, extractions: {} },
      { ...history, formatVersion: 2 },
      { ...analysis, formatVersion: 2 },
      { ...history, formatVersion: 3 },
      { ...analysis, formatVersion: 3 },
      { ...history, kind: 'other', extractions: {} },
    ]) {
      await atomicWrite(file, JSON.stringify(record));
      await assert.rejects(readHistoryEnvelope(file), /Invalid workflow-history v1 envelope/);
      await assert.rejects(readRunAnalysis(file), /Invalid run-analysis v1 envelope/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('validates fixed envelope fields and payload containers', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-history-audit-'));
  try {
    const file = path.join(root, 'record.json');
    for (const field of ['namespace', 'workflowId', 'runId', 'taskQueue']) {
      await atomicWrite(file, JSON.stringify({ ...history, [field]: 123 }));
      await assert.rejects(readHistoryEnvelope(file), /Invalid workflow-history v1 envelope/);
      await atomicWrite(file, JSON.stringify({ ...analysis, [field]: 123 }));
      await assert.rejects(readRunAnalysis(file), /Invalid run-analysis v1 envelope/);
    }
    await atomicWrite(file, JSON.stringify({ ...history, history: { events: {} } }));
    await assert.rejects(readHistoryEnvelope(file), /Invalid workflow-history v1 envelope/);
    await atomicWrite(file, JSON.stringify({ ...analysis, extractions: [] }));
    await assert.rejects(readRunAnalysis(file), /Invalid run-analysis v1 envelope/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
