import { Connection, Client, ActivityExecutionFailedError } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import * as activities from './activities';
import { nanoid } from 'nanoid';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  // Typed client interface ensures activity names and argument types are all correct at build time
  const activitiesClient = client.activity.typed<typeof activities>();

  const taskQueue = 'hello-standalone-activities';
  const activityOptions = {
    taskQueue,
    startToCloseTimeout: '10s' as const,
  };

  // In practice, use a meaningful business ID, like customer ID or transaction ID
  const activityId = nanoid();

  // Handle can be used to get information and control the activity
  // @@@SNIPSTART typescript-standalone-activity-start
  const handle = await activitiesClient.start('greet', {
    ...activityOptions,
    id: activityId,
    args: [{ name: 'Temporal' }],
  });
  // @@@SNIPEND

  // Optional: wait for activity result
  // @@@SNIPSTART typescript-standalone-activity-result
  console.log((await handle.result()).greeting); // Hello, Temporal!
  // @@@SNIPEND

  // `execute` allows starting the activity and getting the result in one go
  const result = await activitiesClient.execute('greet', {
    ...activityOptions,
    id: activityId + '-2',
    args: [{ name: 'World' }],
  });
  console.log(result.greeting); // Hello, World!

  // If needed, activity handle can be recreated from just activity ID, although with weaker type safety
  // @@@SNIPSTART typescript-standalone-activity-get-handle
  const newHandle = client.activity.getHandle<activities.GreetResult>(activityId);
  // @@@SNIPEND
  console.log((await newHandle.result()).greeting); // Hello, Temporal!

  // Activity client can execute activities without the typed interface - useful when activity declarations are unavailable
  try {
    await client.activity.execute('greet', {
      ...activityOptions,
      id: activityId + '-3',
      args: [{ name: 1 }],
    });
  } catch (err) {
    if (err instanceof ActivityExecutionFailedError) {
      console.log('Oops!', err.cause?.message); // Oops! name must be a string
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
