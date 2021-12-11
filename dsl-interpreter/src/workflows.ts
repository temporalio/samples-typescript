import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

export type DSL = {
  variables: Record<string, unknown>;
  root: Statement;
};

type Sequence = {
  elements: Statement[];
};
type ActivityInvocation = {
  name: string;
  arguments?: string[];
  result?: string;
};
type Parallel = {
  branches: Statement[];
};

type Statement = { activity: ActivityInvocation } | { sequence: Sequence } | { parallel: Parallel };

const acts = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
}) as Record<string, (...args: string[]) => Promise<string | undefined>>;

export async function DSLInterpreter(dsl: DSL): Promise<unknown> {
  const bindings = dsl.variables as Record<string, string>;
  return await execute(dsl.root, bindings);
}

async function execute(
  statement: Statement,
  bindings: Record<string, string | undefined>
): Promise<void> {
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
    let args = activity.arguments || [];
    args = args.map((arg) => bindings[arg] ?? arg);
    const activityResult = await acts[activity.name](...args);
    if (activity.result) {
      bindings[activity.result] = activityResult;
    }
  }
}
