// #!/usr/bin/env node
import express from 'express';
import { setTimeout } from 'timers/promises';

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

app.get('/api/data', async function (req, res) {
  await setTimeout(100);
  res.json({ title: 'Express' });
});

app.set('port', port);

import http from 'http';
const server = http.createServer(app);
server.listen(port);
