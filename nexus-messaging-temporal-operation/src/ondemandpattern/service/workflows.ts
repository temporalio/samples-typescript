import * as wf from '@temporalio/workflow';
import {
  AttachApprovalContextInput,
  GetLanguageOutput,
  GetLanguagesOutput,
  Language,
  RunFromRemoteOutput,
  SetLanguageOutput,
} from '../api';
import { createActivities } from './activities';

const { callGreetingService } = wf.proxyActivities<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '10s',
});

export const getLanguagesQuery = wf.defineQuery<GetLanguagesOutput>('getLanguages');
export const getLanguageQuery = wf.defineQuery<GetLanguageOutput>('getLanguage');
type LanguageInput = { language: Language };
export const setLanguageUpdate = wf.defineUpdate<SetLanguageOutput, [LanguageInput]>('setLanguage');
export const setLanguageUsingActivityUpdate = wf.defineUpdate<SetLanguageOutput, [LanguageInput]>(
  'setLanguageUsingActivity',
);
export const approveSignal = wf.defineSignal<[]>('approve');
export const attachApprovalContextSignal = wf.defineSignal<[AttachApprovalContextInput]>('attachApprovalContext');

const INITIAL_GREETINGS: Partial<Record<Language, string>> = {
  chinese: '你好，世界',
  english: 'Hello, world',
};

export async function greetingWorkflow(): Promise<RunFromRemoteOutput> {
  let language: Language = 'english';
  let greetings: Partial<Record<Language, string>> = { ...INITIAL_GREETINGS };
  let approved = false;
  let approvalContext: string | undefined;

  wf.setHandler(getLanguagesQuery, () => ({ languages: Object.keys(greetings) as Language[] }));

  wf.setHandler(getLanguageQuery, () => ({ language }));

  wf.setHandler(
    setLanguageUpdate,
    async ({ language: newLanguage }): Promise<SetLanguageOutput> => {
      const previous = language;
      if (!(newLanguage in greetings)) {
        const allGreetings = await callGreetingService();
        greetings = { ...greetings, ...allGreetings };
      }
      language = newLanguage;
      return { previousLanguage: previous };
    },
    {
      validator: ({ language: newLanguage }) => {
        const validLanguages: Language[] = ['arabic', 'chinese', 'english', 'french', 'hindi', 'portuguese', 'spanish'];
        if (!validLanguages.includes(newLanguage)) {
          throw new Error(`Invalid language: ${newLanguage}`);
        }
      },
    },
  );

  wf.setHandler(setLanguageUsingActivityUpdate, async ({ language: newLanguage }): Promise<SetLanguageOutput> => {
    const previous = language;
    const allGreetings = await callGreetingService();
    greetings = { ...greetings, ...allGreetings };
    language = newLanguage;
    return { previousLanguage: previous };
  });

  wf.setHandler(approveSignal, () => {
    wf.log.info('approve signal received', { approvalContext });
    approved = true;
  });

  wf.setHandler(attachApprovalContextSignal, (input: AttachApprovalContextInput) => {
    wf.log.info('attachApprovalContext signal received', { userId: input.userId, note: input.note });
    approvalContext = input.note;
  });

  await wf.condition(() => approved && wf.allHandlersFinished());

  return { greeting: greetings[language] ?? `Hello from ${language}` };
}
