import * as wf from '@temporalio/workflow';
import { nexusRemoteGreetingService, NEXUS_ENDPOINT, Language } from '../api';

const nexusClient = wf.createNexusClient({
  service: nexusRemoteGreetingService,
  endpoint: NEXUS_ENDPOINT,
});

export async function callerRemoteWorkflow(): Promise<string[]> {
  const log: string[] = [];

  const userIdOne = 'UserId_One';
  const userIdTwo = 'UserId_Two';

  // Start both remote workflows concurrently
  const [handleOne, handleTwo] = await Promise.all([
    nexusClient.startOperation(
      'runFromRemote',
      { userId: userIdOne },
      { scheduleToCloseTimeout: '60s' },
    ),
    nexusClient.startOperation(
      'runFromRemote',
      { userId: userIdTwo },
      { scheduleToCloseTimeout: '60s' },
    ),
  ]);

  log.push(`started workflow one for user: ${userIdOne}`);
  log.push(`started workflow two for user: ${userIdTwo}`);

  // Interact with workflow one: query languages, set language to spanish
  const languagesOne = await nexusClient.executeOperation(
    'getLanguages',
    { userId: userIdOne },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`workflow one languages: ${languagesOne.join(', ')}`);

  const prevLangOne: Language = await nexusClient.executeOperation(
    'setLanguage',
    { userId: userIdOne, language: 'spanish' as Language },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`workflow one: set language to spanish, previous was: ${prevLangOne}`);

  // Interact with workflow two: query language, set language to hindi
  const currentLangTwo = await nexusClient.executeOperation(
    'getLanguage',
    { userId: userIdTwo },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`workflow two current language: ${currentLangTwo}`);

  const prevLangTwo: Language = await nexusClient.executeOperation(
    'setLanguage',
    { userId: userIdTwo, language: 'hindi' as Language },
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
  log.push(`workflow one result: ${resultOne}`);
  log.push(`workflow two result: ${resultTwo}`);

  return log;
}
