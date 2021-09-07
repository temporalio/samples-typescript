import { Workflow } from '@temporalio/workflow';

export enum ExpenseStatus {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT',
  COMPLETED = 'COMPLETED'
}

export interface Expense extends Workflow {
  main(expenseId: string, timeoutMS?: number): Promise<{ status: ExpenseStatus }>;

  signals: {
    approve(): void;
    reject(): void;
  };
}