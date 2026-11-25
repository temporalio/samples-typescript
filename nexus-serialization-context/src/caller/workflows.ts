import { createNexusServiceClient, log } from '@temporalio/workflow';
import { syncEchoService, asyncEchoService } from '../api';
import { ENDPOINTS, EndpointResults } from '../shared';

export async function callerWorkflow(message: string): Promise<EndpointResults> {
  log.info('Calling Nexus endpoints', { endpointCount: ENDPOINTS.length });
  // Execute all eight operations concurrently.
  const replies = await Promise.all(
    ENDPOINTS.flatMap((endpoint) => {
      const sync = createNexusServiceClient({ endpoint, service: syncEchoService });
      const async = createNexusServiceClient({ endpoint, service: asyncEchoService });
      return [
        sync.executeOperation('echo', message, { scheduleToCloseTimeout: '30s' }),
        async.executeOperation('echoAsync', message, { scheduleToCloseTimeout: '30s' }),
      ];
    }),
  );
  // Promise.all preserves input order: each endpoint contributes a sync/async pair.
  const results = Object.fromEntries(
    ENDPOINTS.map((endpoint, index) => [endpoint, { sync: replies[index * 2], async: replies[index * 2 + 1] }]),
  );
  log.info('Received sync and async replies', { endpointCount: ENDPOINTS.length });
  return results;
}
