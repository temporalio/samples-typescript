'use strict';

// @@@SNIPSTART nodejs-js-hello-workflow
const { greet } = require('@activities/greeter');

async function main(message) {
  return greet(message);
}

exports.workflow = { main };
// @@@SNIPEND