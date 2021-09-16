import { ExpenseStatus } from '../interfaces';
import express from 'express';

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function run() {
  const app = express();
  app.use(express.json());

  const allExpenses = new Map();

  app.get('/', function (req, res) {
    res.json(allExpenses);
  });

  app.get('/list', function (req, res) {
    res.json(allExpenses);
  });

  app.post('/create', function (req, res) {
    // Make sure you validate that `req.body` exists in prod
    const { id } = req.body;
    allExpenses.set(id, ExpenseStatus.CREATED);

    return res.json({ ok: 1 });
  });

  app.post('/action', function (req, res) {
    const { id } = req.body;
    const oldState = allExpenses.get(id);
    if (oldState == null) {
      throw new Error(`Invalid id ${req.body.id}`);
    }
    let newState = '';

    switch (req.body.action) {
      case 'approve':
        newState = ExpenseStatus.APPROVED;
        allExpenses.set(id, ExpenseStatus.APPROVED);
        break;
      case 'reject':
        newState = ExpenseStatus.REJECTED;
        allExpenses.set(id, ExpenseStatus.REJECTED);
        break;
      case 'payment':
        newState = ExpenseStatus.COMPLETED;
        allExpenses.set(id, ExpenseStatus.COMPLETED);
        break;
      default:
        throw new Error(`Invalid action ${req.body.action}`);
    }

    return res.json({ ok: 1, newState });
  });

  app.get('/status', function (req, res) {
    const { id } = req.query;
    return res.json({ status: allExpenses.get(id) });
  });

  await app.listen(3000);
  console.log('Listening on port 3000');
}
