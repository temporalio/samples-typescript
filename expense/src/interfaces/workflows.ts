import { Workflow } from '@temporalio/workflow';

export interface Expense extends Workflow {
  main(expenseId: string): Promise<{ status: string }>;

  signals: {
    approve(): void;
    reject(): void;
  };
}