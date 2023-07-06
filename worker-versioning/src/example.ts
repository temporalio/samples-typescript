import { Connection, Client } from '@temporalio/client';
import { uuid4 } from '@temporalio/workflow';
import { proceeder, versioningExample } from './workflowsV1';
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({
    connection,
  });
  const taskQueue = 'versioned-queue_' + uuid4();

  // First, let's make the task queue use the build id versioning feature by adding an initial
  // default version to the queue:
  await client.taskQueue.updateBuildIdCompatibility(taskQueue, {
    operation: 'addNewIdInNewDefaultSet',
    buildId: '1.0',
  });

  // Start a 1.0 worker
  const worker1 = await Worker.create({
    workflowsPath: require.resolve('./workflowsV1'),
    activities,
    taskQueue,
    buildId: '1.0',
    useVersioning: true,
  });
  const worker1Run = worker1.run();

  // Start a workflow that will run on the 1.0 worker
  const firstWorkflowID = 'worker-versioning-first_' + uuid4();
  const firstWorkflow = await client.workflow.start(versioningExample, {
    workflowId: firstWorkflowID,
    taskQueue,
    workflowExecutionTimeout: '5 minutes',
  });

  // Signal the workflow to drive it
  await firstWorkflow.signal(proceeder, 'go');

  // Give a chance for the worker to process the signal
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Add a new compatible version to the queue
  await client.taskQueue.updateBuildIdCompatibility(taskQueue, {
    operation: 'addNewCompatibleVersion',
    buildId: '1.1',
    existingCompatibleBuildId: '1.0',
  });

  // Stop the old worker, and start a 1.1 worker. We do this to speed along the example, since the
  // 1.0 worker may continue to process tasks briefly after the version update.
  worker1.shutdown();
  await worker1Run;
  const worker11 = await Worker.create({
    workflowsPath: require.resolve('./workflowsV11'),
    activities,
    taskQueue,
    buildId: '1.1',
    useVersioning: true,
  });
  const worker11Run = worker11.run();

  // Continue driving the workflow. Take note that the new version of the workflow run by the 1.1
  // worker is the one that takes over! You might see a workflow task timeout, if the 1.0 worker is
  // processing a task as the version update happens. That's normal.
  await firstWorkflow.signal(proceeder, 'go');

  // Add a new *incompatible* version to the task queue, which will become the new overall default
  // for the queue.
  await client.taskQueue.updateBuildIdCompatibility(taskQueue, {
    operation: 'addNewIdInNewDefaultSet',
    buildId: '2.0',
  });
  // Start a 2.0 worker
  const worker2 = await Worker.create({
    workflowsPath: require.resolve('./workflowsV2'),
    activities,
    taskQueue,
    buildId: '2.0',
    useVersioning: true,
  });
  const worker2Run = worker2.run();

  // Start a new workflow. Note that it will run on the new 2.0 version, without the client
  // invocation changing at all!
  const secondWorkflowID = 'worker-versioning-second_' + uuid4();
  const secondWorkflow = await client.workflow.start(versioningExample, {
    workflowId: secondWorkflowID,
    taskQueue,
    workflowExecutionTimeout: '5 minutes',
  });

  // Drive both workflows once more before concluding them
  // firstWorkflow will continue to be run on the 1.1 Worker.
  await firstWorkflow.signal(proceeder, 'go');
  await secondWorkflow.signal(proceeder, 'go');
  await firstWorkflow.signal(proceeder, 'finish');
  await secondWorkflow.signal(proceeder, 'finish');

  // Wait for workflows to finish
  await Promise.all([firstWorkflow.result(), secondWorkflow.result()]);

  // Lastly we'll demonstrate how you can use the gRPC api to determine if certain build IDs are
  // ready to be retired. There's more information in the documentation, but here's a quick example
  // that will show us that we can retire the 1.0 worker:
  const reachability = await client.taskQueue.getReachability({
    buildIds: ['1.0'],
  });
  console.log('Reachability:', reachability);
  if (reachability.buildIdReachability['1.0'].taskQueueReachability[taskQueue].length === 0) {
    console.log('Confirmed that 1.0 is ready to be retired!');
  }

  // Stop all workers
  worker11.shutdown();
  worker2.shutdown();
  await Promise.all([worker11Run, worker2Run]);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
