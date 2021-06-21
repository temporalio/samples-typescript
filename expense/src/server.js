'use strict';

const express = require('express');

const expenseState = Object.freeze({
  created: 'CREATED',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  completed: 'COMPLETED'
})

run().catch(err => console.log(err));

async function run() {
  const app = express();
  app.use(express.json());

  const allExpenses = {};
  const tokenMap = {};

  app.get('/', function(req, res) {
    res.json(allExpenses);
  });

  app.get('/list', function(req, res) {
    res.json(allExpenses);
  });

  app.post('/create', function(req, res) {
    allExpenses[req.body.id] = expenseState.created;

    return res.json({ ok: 1 });
  });

  app.post('/action', function(req, res) {
    const oldState = allExpenses[req.body.id];
    if (oldState == null) {
      throw new Error(`Invalid id ${req.body.id}`);
    }
    switch (req.body.action) {
    case 'approve':
      allExpenses[req.body.id] = expenseState.approved;
      break;
    case 'reject':
      allExpenses[req.body.id] = expenseState.rejected;
      break;
    case 'payment':
      allExpenses[req.body.id] = expenseState.completed;
      break;
    default:
      throw new Error(`Invalid action ${req.body.action}`);
    }

    const id = req.body.id;
    
    if (oldState == expenseState.created &&
        (allExpenses[id] == expenseState.approved || allExpenses[id] == expenseState.rejected)) {
      // report state change
      // notifyExpenseStateChange(id, allExpenses[id])
    }

    return res.json({ ok: 1 });
  });

  app.get('/status', function(req, res) {
    const id = req.query.id;
    return res.json({ status: allExpenses[id] });
  });

  app.post('/registerCallback', function(req, res) {
    const id = req.body.id;
    const taskToken = req.body.taskToken;
    tokenMap[id] = taskToken;

    return res.json({ ok: 1 });
  });

  await app.listen(3000);
  console.log('Listening on port 3000');

  /*function notifyExpenseStateChange(id, newStatus) {
    const token = tokenMap[id];
  }*/
}