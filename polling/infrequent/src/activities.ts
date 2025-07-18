import { ComposeGreetingInput, getServiceResult } from "./service";
import {
  ApplicationFailure,
  ApplicationFailureCategory,
} from '@temporalio/common';

export async function composeGreeting(input: ComposeGreetingInput): Promise<string> {
    try {
      return await getServiceResult(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw ApplicationFailure.create({
        message,
        // Set the error as BENIGN to indicate it is an expected error.
        // BENIGN errors have activity failure logs downgraded to DEBUG level
        // and do not emit activity failure metrics.
        category: ApplicationFailureCategory.BENIGN,
      });
    }
}