import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nanoid } from 'nanoid';
import { PAYLOAD_SIZE_THRESHOLD, STORAGE_ROOT, createDataConverter } from './data-converter';
import { TASK_QUEUE, makeDocument } from './shared';
import { processDocument } from './workflows';

const DOCUMENT_SIZE_BYTES = 1024 * 1024;

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);

  // The Client offloads too. Without external storage configured here, the 1 MiB
  // argument below would be sent inline and rejected for exceeding Temporal's
  // per-payload limit, and an offloaded result would come back as an unreadable
  // reference.
  const client = new Client({ connection, dataConverter: createDataConverter() });

  const document = makeDocument('quarterly-report.txt', DOCUMENT_SIZE_BYTES);
  console.log(`Starting workflow with a ${document.content.length} byte document`);
  console.log(`Payloads of ${PAYLOAD_SIZE_THRESHOLD} bytes or more are offloaded to ${STORAGE_ROOT}`);

  const workflowId = `document-${nanoid()}`;
  const handle = await client.workflow.start(processDocument, {
    args: [document],
    taskQueue: TASK_QUEUE,
    workflowId,
  });
  console.log(`Started workflow ${handle.workflowId}`);

  const result = await handle.result();
  console.log(`Summary: ${result.summary}`);
  console.log(`Received ${result.extractedText.length} bytes of extracted text`);
  console.log(`\nTo see what the server actually stored, run:\n  npm run inspect ${workflowId}`);

  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
