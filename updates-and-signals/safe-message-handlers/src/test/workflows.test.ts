import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import { bundleWorkflowCode, WorkflowBundleWithSourceMap, DefaultLogger, Runtime, Worker } from '@temporalio/worker';
import * as activities from '../activities';
import {
  clusterManagerWorkflow,
  assignNodesToJobUpdate,
  startClusterSignal,
  shutdownClusterSignal,
  deleteJobUpdate,
  getClusterStatusQuery,
} from '../workflows';
import { nanoid } from 'nanoid';
import assert from 'assert';

const taskQueue = 'test' + new Date().toLocaleDateString('en-US');

describe('cluster manager', function () {
  this.timeout(10000);
  let worker: Worker;
  let env: TestWorkflowEnvironment;
  let workflowBundle: WorkflowBundleWithSourceMap;

  before(async function () {
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.createLocal();

    workflowBundle = await bundleWorkflowCode({
      workflowsPath: require.resolve('../workflows'),
      logger: new DefaultLogger('WARN'),
    });
  });

  beforeEach(async function () {
    worker = await Worker.create({
      connection: env.nativeConnection,
      workflowBundle,
      activities,
      taskQueue,
    });
  });

  after(async function () {
    await env.teardown();
  });

  it('successfully completes a session', async function () {
    await worker.runUntil(async function () {
      const workflow = await env.client.workflow.start(clusterManagerWorkflow, {
        taskQueue,
        workflowId: `cluster-manager-${nanoid()}`,
      });
      await workflow.signal(startClusterSignal);
      const request1 = {
        numNodes: 5,
        jobName: 'job1',
      };
      // Use an update to assign nodes.
      const updateResult1 = await workflow.executeUpdate(assignNodesToJobUpdate, {
        args: [request1],
      });
      assert.equal(updateResult1.assignedNodes, request1.numNodes);
      assert.equal(updateResult1.maxAssignedNodes, request1.numNodes);
      // Assign nodes to a job and then delete it
      const request2 = {
        numNodes: 6,
        jobName: 'job2',
      };
      const updateResult2 = await workflow.executeUpdate(assignNodesToJobUpdate, {
        args: [request2],
      });
      assert.equal(updateResult2.assignedNodes, request1.numNodes + request2.numNodes);
      assert.equal(updateResult2.maxAssignedNodes, request1.numNodes + request2.numNodes);
      await workflow.executeUpdate(deleteJobUpdate, { args: [{ jobName: 'job2' }] });
      // The delete doesn't return anything; use the query to get current cluster state
      const queryResult = await workflow.query(getClusterStatusQuery);
      assert.equal(
        queryResult.assignedNodes,
        request1.numNodes,
        `expected ${request1.numNodes} left after deleting ${request2.numNodes}`
      );
      assert.equal(queryResult.maxAssignedNodes, request1.numNodes + request2.numNodes);
      // Terminate the workflow and check that workflow returns same value as obtained from last query.
      await workflow.signal(shutdownClusterSignal);
      const wfResult = await workflow.result();
      assert.deepEqual(wfResult, queryResult);
    });
  });
});
