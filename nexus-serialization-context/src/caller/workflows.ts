import { createNexusServiceClient, log } from '@temporalio/workflow';
import { syncEchoService, asyncEchoService } from '../api';
import { ENDPOINTS, EndpointResults } from '../shared';

/** Calls one endpoint's sync and async operations concurrently. */
async function echoThrough(endpoint: string, message: string) {
  const [sync, async] = await Promise.all([
    createNexusServiceClient({ endpoint, service: syncEchoService }).executeOperation('echo', message, {
      scheduleToCloseTimeout: '30s',
    }),
    createNexusServiceClient({ endpoint, service: asyncEchoService }).executeOperation('echoAsync', message, {
      scheduleToCloseTimeout: '30s',
    }),
  ]);
  return { endpoint, sync, async };
}

export async function callerWorkflow(message: string): Promise<EndpointResults> {
  log.info('Calling Nexus endpoints', { endpointCount: ENDPOINTS.length });
  // Call every endpoint concurrently, so all eight operations run at once.
  const replies = await Promise.all(ENDPOINTS.map((endpoint) => echoThrough(endpoint, message)));
  const results: EndpointResults = {};
  for (const { endpoint, sync, async } of replies) {
    results[endpoint] = { sync, async };
  }
  log.info('Received sync and async replies', { endpointCount: replies.length });
  return results;
}
