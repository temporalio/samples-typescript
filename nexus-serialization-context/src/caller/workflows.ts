import { createNexusServiceClient, log } from '@temporalio/workflow';
import { syncEchoService, asyncEchoService } from '../api';
import { ENDPOINTS, EndpointResults } from '../shared';

export async function callerWorkflow(message: string): Promise<EndpointResults> {
  log.info('Calling Nexus endpoints', { endpointCount: ENDPOINTS.length });
  // Schedule all eight operations before awaiting any result.
  const operations = ENDPOINTS.map((endpoint) => {
    const sync = createNexusServiceClient({ endpoint, service: syncEchoService });
    const async = createNexusServiceClient({ endpoint, service: asyncEchoService });
    return {
      endpoint,
      sync: sync.startOperation('echo', message, { scheduleToCloseTimeout: '30s' }),
      async: async.startOperation('echoAsync', message, { scheduleToCloseTimeout: '30s' }),
    };
  });
  const started = await Promise.all(
    operations.map(async (operation) => ({
      endpoint: operation.endpoint,
      sync: await operation.sync,
      async: await operation.async,
    })),
  );
  const results = Object.fromEntries(
    await Promise.all(
      started.map(async ({ endpoint, sync, async }) => [
        endpoint,
        { sync: await sync.result(), async: await async.result() },
      ]),
    ),
  );
  log.info('Received sync and async replies', { endpointCount: started.length });
  return results;
}
