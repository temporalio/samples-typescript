import { proxyActivities } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

export type DSL = {
  variables: Record<string, string>; // could be string | number?
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

/** A workflow that simply calls an activity */
export async function DSLInterpreter(dsl: DSL): Promise<any> {
  return execute(dsl.root);
}

async function execute(statement: Statement): Promise<string | undefined> {
  const results = {} as Record<string, string | undefined>;
  // console.log(statement)
  if ('parallel' in statement) {
    await Promise.all(statement.parallel.branches.map(execute));
    // todo: if one activity fails we want to cancel all the others
  } else if ('sequence' in statement) {
    let result: string | undefined;
    for (const el of statement.sequence.elements) {
      result = await execute(el);
    }
    return result;
  } else {
    const activity = statement.activity;
    let args = activity.arguments || [];
    args = args.map((arg) => results[arg] ?? arg);
    const activityResult = await acts[activity.name](...args);
    if (activity.result) {
      results[activity.result] = activityResult;
    }
    return activityResult;
  }
}
