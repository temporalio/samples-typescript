import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import * as wo from '@temporalio/worker';
import * as greetingWorkflow from '../workflows';
import { Language } from '../workflows';
import assert from 'assert';
const taskQueue = 'test' + new Date().toLocaleDateString('en-US');
import { nanoid } from 'nanoid';
import { WorkflowUpdateFailedError } from '@temporalio/client';

describe('greeting workflow', function () {
  this.timeout(10000);
  let worker: wo.Worker;
  let env: TestWorkflowEnvironment;
  let workflowBundle: wo.WorkflowBundleWithSourceMap;

  before(async function () {
    wo.Runtime.install({ logger: new wo.DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.createLocal();

    workflowBundle = await wo.bundleWorkflowCode({
      workflowsPath: require.resolve('../workflows'),
      logger: new wo.DefaultLogger('WARN'),
    });
  });

  beforeEach(async function () {
    worker = await wo.Worker.create({
      connection: env.nativeConnection,
      workflowBundle,
      taskQueue,
      activities: greetingWorkflow.activities,
    });
  });

  after(async function () {
    await env.teardown();
  });

  it('can be queried for supported languages', async function () {
    const wfResult = await worker.runUntil(async () => {
      const wfHandle = await env.client.workflow.start(greetingWorkflow.greetingWorkflow, {
        taskQueue,
        workflowId: nanoid(),
      });
      const supportedLanguages = await wfHandle.query(greetingWorkflow.getLanguages, {
        includeUnsupported: false,
      });
      assert.deepEqual(supportedLanguages, [Language.CHINESE, Language.ENGLISH]);
      await wfHandle.signal(greetingWorkflow.approve, { name: 'test-approver' });
      return await wfHandle.result();
    });
    assert.equal(wfResult, 'Hello, world');
  });

  it('can be queried for unsupported language', async function () {
    const wfResult = await worker.runUntil(async () => {
      const wfHandle = await env.client.workflow.start(greetingWorkflow.greetingWorkflow, {
        taskQueue,
        workflowId: nanoid(),
      });
      const allLanguages = await wfHandle.query(greetingWorkflow.getLanguages, {
        includeUnsupported: true,
      });
      assert.deepEqual(allLanguages, [
        Language.ARABIC,
        Language.CHINESE,
        Language.ENGLISH,
        Language.FRENCH,
        Language.HINDI,
        Language.PORTUGUESE,
        Language.SPANISH,
      ]);
      await wfHandle.signal(greetingWorkflow.approve, { name: 'test-approver' });
      return await wfHandle.result();
    });
    assert.equal(wfResult, 'Hello, world');
  });

  it('can be updated to change the language', async function () {
    const wfResult = await worker.runUntil(async () => {
      const wfHandle = await env.client.workflow.start(greetingWorkflow.greetingWorkflow, {
        taskQueue,
        workflowId: nanoid(),
      });

      const currentLanguage = await wfHandle.query(greetingWorkflow.getLanguage);
      assert.equal(currentLanguage, Language.ENGLISH);

      await wfHandle.executeUpdate(greetingWorkflow.setLanguage, {
        args: [Language.CHINESE],
      });

      const updatedLanguage = await wfHandle.query(greetingWorkflow.getLanguage);
      assert.equal(updatedLanguage, Language.CHINESE);

      await wfHandle.signal(greetingWorkflow.approve, { name: 'test-approver' });
      return await wfHandle.result();
    });
    assert.equal(wfResult, '你好，世界');
  });

  it('rejects an invalid language', async function () {
    const wfResult = await worker.runUntil(async () => {
      const wfHandle = await env.client.workflow.start(greetingWorkflow.greetingWorkflow, {
        taskQueue,
        workflowId: nanoid(),
      });

      const currentLanguage = await wfHandle.query(greetingWorkflow.getLanguage);
      assert.equal(currentLanguage, Language.ENGLISH);

      try {
        await wfHandle.executeUpdate(greetingWorkflow.setLanguage, {
          args: [Language.PORTUGUESE],
        });
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert(err instanceof WorkflowUpdateFailedError, 'Expected WorkflowUpdateFailedError');
      }

      const updatedLanguage = await wfHandle.query(greetingWorkflow.getLanguage);
      assert.equal(updatedLanguage, Language.ENGLISH);

      await wfHandle.signal(greetingWorkflow.approve, { name: 'test-approver' });
      return await wfHandle.result();
    });
    assert.equal(wfResult, 'Hello, world');
  });

  it('can be updated to change the language using an activity', async function () {
    const wfResult = await worker.runUntil(async () => {
      const wfHandle = await env.client.workflow.start(greetingWorkflow.greetingWorkflow, {
        taskQueue,
        workflowId: nanoid(),
      });

      const currentLanguage = await wfHandle.query(greetingWorkflow.getLanguage);
      assert.equal(currentLanguage, Language.ENGLISH);

      await wfHandle.executeUpdate(greetingWorkflow.setLanguageUsingActivity, {
        args: [Language.PORTUGUESE],
      });

      const updatedLanguage = await wfHandle.query(greetingWorkflow.getLanguage);
      assert.equal(updatedLanguage, Language.PORTUGUESE);

      await wfHandle.signal(greetingWorkflow.approve, { name: 'test-approver' });
      return await wfHandle.result();
    });
    assert.equal(wfResult, 'Olá mundo');
  });
});
