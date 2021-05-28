'use strict';

async function makeHTTPRequest() {
  const http = require('http');
  console.log('Test', http, require('path'));

  const res = await new Promise(resolve => {
    http.get('http://httpbin.org/get?answer=42', resolve);
  });

  // A ServerResponse is a readable stream, so you need to use the
  // stream-to-promise pattern to use it with async/await.
  let data = await new Promise((resolve, reject) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('error', err => reject(err));
    res.on('end', () => resolve(data));
  });

  data = JSON.parse(data);
  return data;
}
exports.makeHTTPRequest = makeHTTPRequest;