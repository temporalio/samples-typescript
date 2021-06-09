'use strict';

const { makeHTTPRequest } = require('@activities/makeHTTPRequest');

async function main() {
  const data = await makeHTTPRequest();
  return `The answer is ${data.answer}`;
}

exports.workflow = { main };