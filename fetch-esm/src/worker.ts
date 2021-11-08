// @@@SNIPSTART typescript-esm-worker
import { Worker } from '@temporalio/worker';
import { URL } from 'url';
import path from 'path';
import * as activities from './activities.js';

// Support running both complied code and ts-node/esm loader
const workflowsPath = new URL(`./workflows${path.extname(import.meta.url)}`, import.meta.url).pathname;

const worker = await Worker.create({
  workflowsPath,
  activities,
  taskQueue: 'fetch-esm',
});

await worker.run();
// @@@SNIPEND
