// @@@SNIPSTART typescript-message-passing-introduction
import * as cl from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import * as greetingWorkflow from './workflows';
import { Language } from './workflows';
import { nanoid } from 'nanoid';

export async function run() {
  const config = loadClientConnectConfig();
  const connection = await cl.Connection.connect(config.connectionOptions);
  const client = new cl.Client({ connection });
  const handle = await client.workflow.start(greetingWorkflow.greetingWorkflow, {
    taskQueue: 'my-task-queue',
    args: [],
    workflowId: `messages-introduction-${nanoid()}`,
  });

  const { languages: supportedLanguages } = await handle.query(greetingWorkflow.getLanguages, {
    includeUnsupported: false,
  });
  console.log(`supported languages: ${supportedLanguages}`);

  // Use executeUpdate to change the language
  let { previousLanguage } = await handle.executeUpdate(greetingWorkflow.setLanguage, {
    args: [{ language: Language.CHINESE }],
  });

  // Send a query
  let { language: currentLanguage } = await handle.query(greetingWorkflow.getLanguage);
  console.log(`language changed: ${previousLanguage} -> ${currentLanguage}`);

  // Use startUpdate followed by handle.result() to change the language
  const updateHandle = await handle.startUpdate(greetingWorkflow.setLanguage, {
    args: [{ language: Language.ENGLISH }],
    waitForStage: cl.WorkflowUpdateStage.ACCEPTED,
  });
  ({ previousLanguage } = await updateHandle.result());
  ({ language: currentLanguage } = await handle.query(greetingWorkflow.getLanguage));
  console.log(`language changed: ${previousLanguage} -> ${currentLanguage}`);

  // Use an async update handler that calls an activity to change the language
  ({ previousLanguage } = await handle.executeUpdate(greetingWorkflow.setLanguageUsingActivity, {
    args: [{ language: Language.ARABIC }],
  }));
  ({ language: currentLanguage } = await handle.query(greetingWorkflow.getLanguage));
  console.log(`language changed: ${previousLanguage} -> ${currentLanguage}`);

  // Send a signal
  await handle.signal(greetingWorkflow.approve, { name: '' });
  console.log((await handle.result()).greeting);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
