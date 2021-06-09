'use strict';

const axios = require('axios');

async function makeHTTPRequest() {
  const res = await axios.get('http://httpbin.org/get?answer=42');

  return res.data.args;
}
exports.makeHTTPRequest = makeHTTPRequest;