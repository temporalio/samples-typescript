import * as wf from '@temporalio/workflow';
import { nexusGreetingService, NEXUS_ENDPOINT, Language } from '../api';

const nexusClient = wf.createNexusServiceClient({
  service: nexusGreetingService,
  endpoint: NEXUS_ENDPOINT,
});

export async function callerWorkflow(userId: string): Promise<string[]> {
  const log: string[] = [];

  // Query the list of known languages
  const languages = await nexusClient.executeOperation('getLanguages', { userId }, { scheduleToCloseTimeout: '10s' });
  log.push(`languages: ${languages.join(', ')}`);

  // Query the current language
  const currentLanguage = await nexusClient.executeOperation(
    'getLanguage',
    { userId },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`current language: ${currentLanguage}`);

  // Set language to French via update
  const previousLanguage: Language = await nexusClient.executeOperation(
    'setLanguage',
    { userId, language: 'french' as Language },
    { scheduleToCloseTimeout: '10s' },
  );
  log.push(`set language to french, previous was: ${previousLanguage}`);

  // Approve (signal) the entity workflow
  await nexusClient.executeOperation('approve', { userId }, { scheduleToCloseTimeout: '10s' });
  log.push('approved');

  return log;
}
