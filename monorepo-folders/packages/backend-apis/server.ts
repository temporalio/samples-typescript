// #!/usr/bin/env node
import express from 'express';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const port = 4000;

/** routes */
import * as temporalClient from './temporal-client';
app.get('/api/workflow', async function (req, res) {
  try {
    const result = await temporalClient.runWorkflow().catch((err: Error) => {
      console.error(err);
      process.exit(1);
    });
    res.json({ result });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/api/data', function (req, res) {
  setTimeout(() => {
    // artificial server delay
    res.json({ title: 'Express' });
  }, 100);
});

app.set('port', port);

import http from 'http';
const server = http.createServer(app);
server.listen(port);
