import { ExpenseStatus } from '../workflows';
import express from 'express';
import http from 'http';

const PORT = 3000;

function actionStringToExpenseStatus(action?: string) {
  switch (action) {
    case 'payment':
      return ExpenseStatus.COMPLETED;
    default:
      throw new Error(`Invalid action ${action}`);
  }
}

function isValidTransition(oldStatus: ExpenseStatus, newStatus: ExpenseStatus): boolean {
  switch (oldStatus) {
    case ExpenseStatus.CREATED:
      return newStatus === ExpenseStatus.COMPLETED;
    default:
      return false;
  }
}

async function run() {
  const app = express();
  app.use(express.json());

  const allExpenses = new Map<string, ExpenseStatus>();

  app.get('/', function (_req, res) {
    res.json(allExpenses);
  });

  app.get('/list', function (_req, res) {
    res.json(allExpenses);
  });

  app.post('/create', function (req, res) {
    // Make sure you validate that `req.body` exists in prod
    const { id } = req.body;
    allExpenses.set(id, ExpenseStatus.CREATED);

    return res.json({ ok: true });
  });

  app.post('/action', function (req, res) {
    const { id, action } = req.body;
    if (typeof id !== 'string' || typeof action !== 'string') {
      return res.status(400).json({ error: 'Invalid request body, expected JSON with id and action attributes' });
    }
    const oldStatus = allExpenses.get(id);
    if (oldStatus === undefined) {
      return res.status(404).json({ error: `No expense found for id: ${id}` });
    }
    const newStatus = actionStringToExpenseStatus(action);
    if (!isValidTransition(oldStatus, newStatus)) {
      return res.status(400).json({ error: `Invalid status transition ${oldStatus} -> ${newStatus}` });
    }
    allExpenses.set(id, newStatus);
    return res.json({ ok: true, newStatus: newStatus });
  });

  app.get('/status', function (req, res) {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing "id" query param' });
    }
    const status = allExpenses.get(id);
    if (status === undefined) {
      return res.status(404).json({ error: `No expense found for id: ${id}` });
    }
    return res.json({ status });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(PORT, resolve);
    server.once('error', reject);
  });

  console.log(`Listening on port ${PORT}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
