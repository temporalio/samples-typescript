import { Workflow } from '@temporalio/workflow';

export interface Progress extends Workflow {
  main(): Promise<number>;

  queries: {
    getProgress(): number;
  };
}