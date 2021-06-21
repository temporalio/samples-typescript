'use strict';

const axios = require('axios');

async function createExpense(id) {
  const res = await axios.post('http://localhost:3000/create', { id });

  return res.data;
}
exports.createExpense = createExpense;