import * as wf from '@temporalio/workflow';
import { Language } from '../api';
import { createActivities } from './activities';

const { callGreetingService } = wf.proxyActivities<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '10s',
});

export const getLanguagesQuery = wf.defineQuery<Language[], []>('getLanguages');
export const getLanguageQuery = wf.defineQuery<Language, []>('getLanguage');
export const setLanguageUpdate = wf.defineUpdate<Language, [Language]>('setLanguage');
export const setLanguageUsingActivityUpdate = wf.defineUpdate<Language, [Language]>('setLanguageUsingActivity');
export const approveSignal = wf.defineSignal<[]>('approve');

const INITIAL_GREETINGS: Partial<Record<Language, string>> = {
  chinese: '你好，世界',
  english: 'Hello, world',
};

export async function greetingWorkflow(): Promise<string> {
  let language: Language = 'english';
  let greetings: Partial<Record<Language, string>> = { ...INITIAL_GREETINGS };
  let approved = false;

  wf.setHandler(getLanguagesQuery, () => Object.keys(greetings) as Language[]);

  wf.setHandler(getLanguageQuery, () => language);

  wf.setHandler(
    setLanguageUpdate,
    async (newLanguage: Language): Promise<Language> => {
      const previous = language;
      if (!(newLanguage in greetings)) {
        const allGreetings = await callGreetingService();
        greetings = { ...greetings, ...allGreetings };
      }
      language = newLanguage;
      return previous;
    },
    {
      validator: (newLanguage: Language) => {
        const validLanguages: Language[] = ['arabic', 'chinese', 'english', 'french', 'hindi', 'portuguese', 'spanish'];
        if (!validLanguages.includes(newLanguage)) {
          throw new Error(`Invalid language: ${newLanguage}`);
        }
      },
    },
  );

  wf.setHandler(setLanguageUsingActivityUpdate, async (newLanguage: Language): Promise<Language> => {
    const previous = language;
    const allGreetings = await callGreetingService();
    greetings = { ...greetings, ...allGreetings };
    language = newLanguage;
    return previous;
  });

  wf.setHandler(approveSignal, () => {
    approved = true;
  });

  await wf.condition(() => approved && wf.allHandlersFinished());

  return greetings[language] ?? `Hello from ${language}`;
}
