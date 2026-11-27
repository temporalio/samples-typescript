import * as wf from '@temporalio/workflow';
import { nexusRemoteGreetingService, NEXUS_ENDPOINT } from '../api';

const nexusClient = wf.createNexusServiceClient({
  service: nexusRemoteGreetingService,
  endpoint: NEXUS_ENDPOINT,
});

type CallerRemoteWorkflowResult = { log: string[] };

export async function callerRemoteWorkflow(): Promise<CallerRemoteWorkflowResult> {
  const log: string[] = [];

  const userIdOne = 'UserId_One';
  const userIdTwo = 'UserId_Two';

  // Start both remote workflows concurrently
  const [handleOne, handleTwo] = await Promise.all([
    nexusClient.startOperation('runFromRemote', { userId: userIdOne }, { scheduleToCloseTimeout: '60s' }),
    nexusClient.startOperation('runFromRemote', { userId: userIdTwo }, { scheduleToCloseTimeout: '60s' }),
  ]);

  log.push(`started workflow one for user: ${userIdOne}`);
  log.push(`started workflow two for user: ${userIdTwo}`);

  // Interact with workflow one: query languages, set language to spanish
  const { languages: languagesOne } = await nexusClient.executeOperation(
    'getLanguages',
    { userId: userIdOne },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`workflow one languages: ${languagesOne.join(', ')}`);

  const { previousLanguage: prevLangOne } = await nexusClient.executeOperation(
    'setLanguage',
    { userId: userIdOne, language: 'spanish' },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`workflow one: set language to spanish, previous was: ${prevLangOne}`);

  // Interact with workflow two: query language, set language to hindi
  const { language: currentLangTwo } = await nexusClient.executeOperation(
    'getLanguage',
    { userId: userIdTwo },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`workflow two current language: ${currentLangTwo}`);

  const { previousLanguage: prevLangTwo } = await nexusClient.executeOperation(
    'setLanguage',
    { userId: userIdTwo, language: 'hindi' },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`workflow two: set language to hindi, previous was: ${prevLangTwo}`);

  // Approve both workflows
  await Promise.all([
    nexusClient.executeOperation('approve', { userId: userIdOne }, { scheduleToCloseTimeout: '10s' }),
    nexusClient.executeOperation('approve', { userId: userIdTwo }, { scheduleToCloseTimeout: '10s' }),
  ]);
  log.push('approved both workflows');

  // Wait for both results
  const [resultOne, resultTwo] = await Promise.all([handleOne.result(), handleTwo.result()]);
  log.push(`workflow one result: ${resultOne.greeting}`);
  log.push(`workflow two result: ${resultTwo.greeting}`);

  return { log };
}
