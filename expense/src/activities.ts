import axios from 'axios';

export async function createExpense(id: string): Promise<void> {
  await axios.post('http://localhost:3000/create', { id });
}

export async function payment(id: string): Promise<void> {
  await axios.post('http://localhost:3000/action', { id, action: 'payment' });
}
