'use strict';

const axios = require('axios');

async function payment(id) {
  const res = await axios.post('http://localhost:3000/action', { id, action: 'payment' });

  return res.data;
}
exports.payment = payment;