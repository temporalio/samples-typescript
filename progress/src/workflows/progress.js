'use strict';

const { sleep } = require('@temporalio/workflow');

let progress = 0;

async function main() {
  for (let i = 0; i < 10; ++i) {
    progress += 10;
    await sleep(10);
  }

  return progress;
}

exports.workflow = {
  main,
  queries: {
    getProgress: () => progress
  }
};