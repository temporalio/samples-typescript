'use strict';

// @@@SNIPSTART nodejs-js-hello-activity
const { greet } = require('@activities/greeter');

async function main(message) {
  return greet(message);
}

exports.workflow = { main };
// @@@SNIPEND