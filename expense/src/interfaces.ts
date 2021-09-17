export enum ExpenseStatus {
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT',
  COMPLETED = 'COMPLETED',
}

export type Expense = (
  expenseId: string,
  timeoutMS?: number
) => {
  execute(): Promise<{ status: ExpenseStatus }>;

  signals: {
    approve(): void;
    reject(): void;
  };
};
