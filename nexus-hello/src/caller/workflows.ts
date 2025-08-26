// @@@SNIPSTART typescript-nexus-hello-caller-workflow
import * as wf from '@temporalio/workflow';
import { helloService, LanguageCode } from '../api';

const HELLO_SERVICE_ENDPOINT = 'my-nexus-endpoint-name';

export async function echoCallerWorkflow(message: string): Promise<string> {
  const nexusClient = wf.createNexusClient({
    service: helloService,
    endpoint: HELLO_SERVICE_ENDPOINT,
  });

  const result = await nexusClient.executeOperation(
    'echo',
    { message },
    { scheduleToCloseTimeout: '10s' }
  );

  return result.message;
}

export async function helloCallerWorkflow(name: string, language: LanguageCode): Promise<string> {
  const nexusClient = wf.createNexusClient({
    service: helloService,
    endpoint: HELLO_SERVICE_ENDPOINT,
  });

  const helloResult = await nexusClient.executeOperation(
    'hello',
    { name, language },
    { scheduleToCloseTimeout: '10s' }
  );

  return helloResult.message;
}
// @@@SNIPEND
