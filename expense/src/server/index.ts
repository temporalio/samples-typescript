import express from 'express';

enum expenseState {
  created = 'CREATED',
  approved = 'APPROVED',
  rejected = 'REJECTED',
  completed = 'COMPLETED'
}

run().catch(err => console.log(err));

async function run() {
  const app = express();
  app.use(express.json());

  const allExpenses = new Map();

  app.get('/', function(req, res) {
    res.json(allExpenses);
  });

  app.get('/list', function(req, res) {
    res.json(allExpenses);
  });

  app.post('/create', function(req, res) {
    // Make sure you validate that `req.body` exists in prod
    const { id } = req.body;
    allExpenses.set(id, expenseState.created);

    return res.json({ ok: 1 });
  });

  app.post('/action', function(req, res) {
    const { id } = req.body;
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

    return res.json({ ok: 1 });
  });

  app.get('/status', function(req, res) {
    const { id } = req.query;
    return res.json({ status: allExpenses.get(id) });
  });

  await app.listen(3000);
  console.log('Listening on port 3000');
}