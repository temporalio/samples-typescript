import { ApplicationFailure } from '@temporalio/common';

export function fnThatThrows() {
  throw ApplicationFailure.nonRetryable('test');
}
