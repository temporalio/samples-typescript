import {
  assignNodesToJobUpdate,
  startClusterSignal,
  shutdownClusterSignal,
  deleteJobUpdate,
  getClusterStatusQuery,
} from './workflows';
import { startClusterManager } from './client';
import assert from 'assert';

async function testClusterManager() {
  const workflow = await startClusterManager();
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
}

async function runTests() {
  for (const fn of [testClusterManager]) {
    console.log(fn.name);
    await fn();
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
