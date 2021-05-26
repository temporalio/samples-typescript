'use strict';

let status = 'default';
let complete = null;
const timeoutMS = 3000;

const signals = {
  approve() {
    status = 'approved';
    if(complete != null) {
      complete();
    }
  },
  deny() {
    status = 'denied';
    if(complete != null) {
      complete();
    }
  }
}

async function main() {
  const worker = new Promise((resolve) => {
    complete = resolve;
  });
  const timer = new Promise((resolve, reject) => setTimeout(reject, timeoutMS));
  await Promise.race([worker, timer]);
  return status;
}
exports.workflow = { main, signals };