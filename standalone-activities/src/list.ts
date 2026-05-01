import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  // Documentation for query syntax available at https://docs.temporal.io/list-filter
  const query = 'TaskQueue="hello-standalone-activities"';

  console.log(`Total activities: ${(await client.activity.count(query)).count}`);

  console.log('ACTIVITY ID | RUN ID | ACTIVITY TYPE | STATUS | COMPLETED TIME');

  for await (const a of client.activity.list(query)) {
    console.log(
      `${a.activityId} | ${a.activityRunId} | ${a.activityType} | ${a.status} | ${a.closeTime?.toISOString()}`,
    );
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
