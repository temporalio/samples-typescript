import { Connection, WorkflowClient } from '@temporalio/client';
import express from 'express';

const expenseState = Object.freeze({
  created: 'CREATED',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  completed: 'COMPLETED'
});

run().catch(err => console.log(err));

async function run() {
  const app = express();
  app.use(express.json());

  // Create a Temporal client
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const allExpenses = new Map();
  const tokenMap = new Map();

  app.get('/', function(req, res) {
    res.json(allExpenses);
  });

  app.get('/list', function(req, res) {
    res.json(allExpenses);
  });

  app.post('/create', function(req, res) {
    allExpenses.set(req.body.id, expenseState.created);

    return res.json({ ok: 1 });
  });

  app.post('/action', function(req, res) {
    const id = req.body.id;
    const oldState = allExpenses.get(id);
    if (oldState == null) {
      throw new Error(`Invalid id ${req.body.id}`);
    }
    let newState = '';

    switch (req.body.action) {
    case 'approve':
      newState = expenseState.approved;
      allExpenses.set(id, expenseState.approved);
      break;
    case 'reject':
      newState = expenseState.rejected;
      allExpenses.set(id, expenseState.rejected);
      break;
    case 'payment':
      newState = expenseState.completed;
      allExpenses.set(id, expenseState.completed);
      break;
    default:
      throw new Error(`Invalid action ${req.body.action}`);
    }

    if (oldState === expenseState.created &&
        (newState === expenseState.approved || newState === expenseState.rejected)) {
      // TODO: need to be able to complete an activity here like in Go
      // https://github.com/temporalio/samples-go/blob/0248987774da74dceb265bb3f3b06e9d00e50a32/expense/server/main.go#L166
    }

    return res.json({ ok: 1 });
  });

  app.get('/status', function(req, res) {
    const id = req.query.id;
    return res.json({ status: allExpenses.get(id) });
  });

  app.post('/registerCallback', function(req, res) {
    const id = req.body.id;
    const taskToken = req.body.taskToken;
    tokenMap.set(id, taskToken);

    return res.json({ ok: 1 });
  });

  await app.listen(3000);
  console.log('Listening on port 3000');
}