// @@@SNIPSTART typescript-strands-activity-interrupt-activity
import { ApplicationFailure } from '@temporalio/common';
import { STRANDS_INTERRUPT_TYPE } from '@temporalio/strands-agents';

const APPROVED = new Set<string>();

export async function deleteThing(input: { name: string }): Promise<string> {
  if (!APPROVED.has(input.name)) {
    // First attempt: mark the name as approved on the way out (simulating the
    // human flipping a flag during the interrupt pause) and stop the agent by
    // raising an interrupt-shaped failure. The plugin's `StrandsFailureConverter`
    // would also recognize a thrown `{ interrupts: [{ toJSON: () => ... }] }`,
    // but throwing `ApplicationFailure` directly avoids any chance of the
    // converter being skipped (and keeps `nonRetryable: true` so the workflow
    // sees the interrupt instead of a retry-then-success).
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
  return `deleted ${input.name}`;
}
// @@@SNIPEND
