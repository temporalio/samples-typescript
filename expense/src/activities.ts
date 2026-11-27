import axios from 'axios';

type ExpenseActivityInput = { id: string };

export async function createExpense({ id }: ExpenseActivityInput): Promise<void> {
  await axios.post('http://localhost:3000/create', { id });
}

export async function payment({ id }: ExpenseActivityInput): Promise<void> {
  await axios.post('http://localhost:3000/action', { id, action: 'payment' });
}
