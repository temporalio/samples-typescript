// @@@SNIPSTART typescript-nexus-cancellation-caller-workflow
import * as wf from '@temporalio/workflow';
import { helloService, LanguageCode } from '../api';

const HELLO_SERVICE_ENDPOINT = 'my-nexus-endpoint-name';

export async function cancellableCallerWorkflow(
  name: string,
  language: LanguageCode,
  waitForCancel: boolean,
): Promise<string> {
  const nexusClient = wf.createNexusClient({
    service: helloService,
    endpoint: HELLO_SERVICE_ENDPOINT,
  });

  // Use the correct cancellation pattern from the TypeScript SDK
  return await wf.CancellationScope.cancellable(async () => {
    const nexusOperationHandle = await nexusClient.startOperation(
      'hello',
      { name, language },
      { scheduleToCloseTimeout: '60s' },
    );

    // Cancel is caller requested to cancel
    if (waitForCancel) {
      wf.CancellationScope.current().cancel();
      // Wait for cancellation to propagate
      await wf.condition(() => wf.CancellationScope.current().consideredCancelled);
    }

    // If cancellation of the operation is requested and completes before the operation completes normally,
    // this will throw a NexusOperationFailure, with `cause` set to a CancelledFailure.
    const result = await nexusOperationHandle.result();
    return result.message;
  });
}
// @@@SNIPEND
