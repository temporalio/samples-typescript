// @@@SNIPSTART typescript-strands-activity-interrupt-activity
import { ApplicationFailure } from '@temporalio/common';
import { STRANDS_INTERRUPT_TYPE } from '@temporalio/strands-agents';

const APPROVED = new Set<string>();

type DeleteThingInput = { name: string };
type DeleteThingResult = { message: string };

export async function deleteThing(input: DeleteThingInput): Promise<DeleteThingResult> {
  if (!APPROVED.has(input.name)) {
    // First attempt: mark the name as approved on the way out (simulating the
    // human flipping a flag during the interrupt pause) and stop the agent by
    // raising an interrupt-shaped failure: a non-retryable `ApplicationFailure`
    // of type `STRANDS_INTERRUPT_TYPE`, which the workflow turns into an agent
    // interrupt instead of a retry. Throwing `{ interrupts: [{ toJSON: () => ... }] }`,
    // the shape of Strands' `InterruptError`, also works: the `StrandsPlugin` on
    // the Worker packages it into the same failure.
    APPROVED.add(input.name);
    throw ApplicationFailure.create({
      message: 'interrupt:approval',
      type: STRANDS_INTERRUPT_TYPE,
      nonRetryable: true,
      details: [
        {
          id: `delete:${input.name}`,
          name: 'approval',
          reason: `approve delete of protected resource '${input.name}'?`,
          source: 'tool',
        },
      ],
    });
  }
  return { message: `deleted ${input.name}` };
}
// @@@SNIPEND
