import { Workflow } from '@temporalio/workflow';

export interface Example extends Workflow {
  main(): Promise<{ message: string }>;
}