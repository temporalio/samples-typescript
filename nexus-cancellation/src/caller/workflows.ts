import * as wf from '@temporalio/workflow';
import { helloService, HelloInput, HelloOutput } from '../api';

const HELLO_SERVICE_ENDPOINT = 'my-nexus-endpoint-name';

export const cancellableCallerWorkflowCancel = wf.defineSignal('cancellableCallerWorkflowCancel');

export async function cancellableCallerWorkflow({ name, language }: HelloInput): Promise<HelloOutput> {
  const nexusClient = wf.createNexusServiceClient({
    service: helloService,
    endpoint: HELLO_SERVICE_ENDPOINT,
  });

  return await wf.CancellationScope.cancellable(async () => {
    // Cancel upon receiving signal.
    wf.setHandler(cancellableCallerWorkflowCancel, async () => {
      wf.CancellationScope.current().cancel();
    });

    const nexusOperationHandle = await nexusClient.startOperation(
      'hello',
      { name, language },
      { scheduleToCloseTimeout: '60s' },
    );

    // If cancellation of the operation is requested and completes before the operation completes normally,
    // this will throw a NexusOperationFailure, with `cause` set to a CancelledFailure.
    try {
      const result = await nexusOperationHandle.result();
      return result;
    } catch (err) {
      if (wf.isCancellation(err)) {
        console.log('Workflow calling Nexus operation cancelled');
      }
      throw err;
    }
  });
}
