// @@@SNIPSTART typescript-esm-worker
import { Worker } from '@temporalio/worker';
import { URL, fileURLToPath } from 'url';
import path from 'path';
import * as activities from './activities.ts';

// Support running both complied code and ts-node/esm loader
const workflowsPathUrl = new URL(`./workflows${path.extname(import.meta.url)}`, import.meta.url);

const worker = await Worker.create({
  workflowsPath: fileURLToPath(workflowsPathUrl),
  activities,
  taskQueue: 'fetch-esm',
});

await worker.run();
// @@@SNIPEND
