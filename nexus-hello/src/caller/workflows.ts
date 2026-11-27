// @@@SNIPSTART typescript-nexus-hello-caller-workflow
import * as wf from '@temporalio/workflow';
import { helloService, EchoInput, EchoOutput, HelloInput, HelloOutput } from '../api';

const HELLO_SERVICE_ENDPOINT = 'my-nexus-endpoint-name';

export async function echoCallerWorkflow({ message }: EchoInput): Promise<EchoOutput> {
  const nexusClient = wf.createNexusServiceClient({
    service: helloService,
    endpoint: HELLO_SERVICE_ENDPOINT,
  });

  const result = await nexusClient.executeOperation('echo', { message }, { scheduleToCloseTimeout: '10s' });

  return result;
}

export async function helloCallerWorkflow({ name, language }: HelloInput): Promise<HelloOutput> {
  const nexusClient = wf.createNexusServiceClient({
    service: helloService,
    endpoint: HELLO_SERVICE_ENDPOINT,
  });

  const helloResult = await nexusClient.executeOperation(
    'hello',
    { name, language },
    { scheduleToCloseTimeout: '10s' },
  );

  return helloResult;
}
// @@@SNIPEND
