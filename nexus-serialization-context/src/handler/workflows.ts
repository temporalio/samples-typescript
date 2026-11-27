import type { EchoResult } from '../api';

type EchoWorkflowInput = { message: string };

export async function EchoWorkflow({ message }: EchoWorkflowInput): Promise<EchoResult> {
  return { message };
}
