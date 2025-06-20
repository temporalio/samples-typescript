import { activityInfo } from '@temporalio/activity';

export interface ComposeGreetingInput {
    greeting: string;
    name: string;
}

const ERROR_ATTEMPTS = 5
const attempts = new Map<string, number> ();

export async function getServiceResult(input: ComposeGreetingInput): Promise<string> {
    const workflowId = activityInfo().workflowExecution.workflowId;
    const currentCount = attempts.get(workflowId) ?? 0;
    attempts.set(workflowId, currentCount + 1);

    console.log(`Attempt ${attempts.get(workflowId)} of ${ERROR_ATTEMPTS} to invoke service`);
    if (attempts.get(workflowId) === ERROR_ATTEMPTS) {
        return `${input.greeting}, ${input.name}!`
    }
    throw new Error("service is down");
}