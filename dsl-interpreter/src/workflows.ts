import { proxyActivities } from '@temporalio/workflow';
import type { ActivityResult } from './activities';

export type DSL = {
  variables: Record<string, unknown>;
  root: Statement;
};

type Sequence = {
  elements: Statement[];
};
type ActivityInput = Record<string, string>;
type ActivityInvocation = {
  name: string;
  arguments?: ActivityInput;
  result?: string;
};
type Parallel = {
  branches: Statement[];
};

type Statement = { activity: ActivityInvocation } | { sequence: Sequence } | { parallel: Parallel };

// Activity names and input fields are selected by the DSL at runtime.
const acts = proxyActivities<Record<string, (input: ActivityInput) => Promise<ActivityResult>>>({
  startToCloseTimeout: '1 minute',
});

export async function DSLInterpreter(dsl: DSL): Promise<void> {
  const bindings = dsl.variables as Record<string, string>;
  await execute(dsl.root, bindings);
}

async function execute(statement: Statement, bindings: Record<string, string | undefined>): Promise<void> {
  // note that this function returns void
  // we don't assign the results here - all results must be declared+bound in the activity DSL
  if ('parallel' in statement) {
    await Promise.all(statement.parallel.branches.map((el) => execute(el, bindings)));
  } else if ('sequence' in statement) {
    for (const el of statement.sequence.elements) {
      await execute(el, bindings);
    }
  } else {
    const activity = statement.activity;
    const input = Object.fromEntries(
      Object.entries(activity.arguments ?? {}).map(([key, value]) => [key, bindings[value] ?? value]),
    );
    const { value } = await acts[activity.name](input);
    if (activity.result) {
      bindings[activity.result] = value;
    }
  }
}
