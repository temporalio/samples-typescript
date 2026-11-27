/* eslint-disable @typescript-eslint/no-unused-vars */
import * as wf from '@temporalio/workflow';
import { Mutex } from 'async-mutex';

export enum Language {
  ARABIC = 'ARABIC',
  CHINESE = 'CHINESE',
  ENGLISH = 'ENGLISH',
  FRENCH = 'FRENCH',
  HINDI = 'HINDI',
  PORTUGUESE = 'PORTUGUESE',
  SPANISH = 'SPANISH',
}

interface GetLanguagesInput {
  includeUnsupported: boolean;
}

interface ApproveInput {
  name: string;
}

interface SetLanguageInput {
  language: Language;
}

type GetLanguagesResult = { languages: Language[] };
type GetLanguageResult = { language: Language };
type SetLanguageResult = { previousLanguage: Language };
type GreetingWorkflowResult = { greeting: string };
type GreetingServiceResult = { greeting?: string };

// 👉 Use the objects returned by defineQuery/defineSignal/defineUpdate to set
// the message handlers in Workflow code, and to send messages from Client code.
export const getLanguages = wf.defineQuery<GetLanguagesResult, [GetLanguagesInput]>('getLanguages');
export const approve = wf.defineSignal<[ApproveInput]>('approve');
export const setLanguage = wf.defineUpdate<SetLanguageResult, [SetLanguageInput]>('setLanguage');
export const setLanguageUsingActivity = wf.defineUpdate<SetLanguageResult, [SetLanguageInput]>(
  'setLanguageUsingActivity',
);
export const getLanguage = wf.defineQuery<GetLanguageResult>('getLanguage');

export async function greetingWorkflow(): Promise<GreetingWorkflowResult> {
  // The workflow has built-in support for two languages only (see remote
  // greeting service below for support for more languages).
  const greetings: Partial<Record<Language, string>> = {
    [Language.CHINESE]: '你好，世界',
    [Language.ENGLISH]: 'Hello, world',
  };

  let approvedForRelease = false;
  let approverName: string | undefined;
  let language = Language.ENGLISH;

  wf.setHandler(getLanguages, (input: GetLanguagesInput): GetLanguagesResult => {
    // 👉 A Query handler returns a value: it must not mutate the Workflow state
    // and cannot perform async operations.
    if (input.includeUnsupported) {
      return { languages: Object.values(Language) };
    } else {
      return { languages: Object.keys(greetings) as Language[] };
    }
  });

  wf.setHandler(approve, (input) => {
    // 👉 A Signal handler mutates the Workflow state but cannot return a value.
    approvedForRelease = true;
    approverName = input.name;
  });

  wf.setHandler(
    setLanguage,
    ({ language: newLanguage }) => {
      // 👉 An Update handler can mutate the Workflow state and return a value.
      const previousLanguage = language;
      language = newLanguage;
      return { previousLanguage };
    },
    {
      validator: ({ language: newLanguage }) => {
        // 👉 Update validators are optional
        if (!(newLanguage in greetings)) {
          throw new wf.ApplicationFailure(`${newLanguage} is not supported`);
        }
      },
    },
  );

  wf.setHandler(getLanguage, () => {
    return { language };
  });

  /**
   * Async update handler featuring an Activity that calls the remote greeting service
   */

  const lock = new Mutex();
  wf.setHandler(setLanguageUsingActivity, async ({ language: newLanguage }) => {
    // 👉 An Update handler can mutate the Workflow state and return a value.
    // 👉 Since this update handler is async, it can execute an activity.
    if (!(newLanguage in greetings)) {
      await lock.runExclusive(async () => {
        // 👉 We use a lock so that, if this handler is executed multiple times,
        // each execution can schedule the activity only when the previously
        // scheduled activity has completed. This ensures that multiple calls to
        // setLanguageUsingActivity are processed in order.
        if (!(newLanguage in greetings)) {
          const { greeting } = await callGreetingService({ language: newLanguage });
          if (!greeting) {
            // 👉 An update validator cannot be async, so cannot be used to check that the remote
            // call_greeting_service supports the requested language. Raising ApplicationError
            // will fail the Update, but the WorkflowExecutionUpdateAccepted event will still be
            // added to history.
            throw new wf.ApplicationFailure(`${newLanguage} is not supported by the greeting service`);
          }
          greetings[newLanguage] = greeting;
        }
      });
    }
    const previousLanguage = language;
    language = newLanguage;
    return { previousLanguage };
  });

  await wf.condition(() => approvedForRelease);
  return { greeting: greetings[language]! }; // eslint-disable-line @typescript-eslint/no-non-null-assertion
}

export const activities = {
  callGreetingService: async ({ language }: SetLanguageInput): Promise<GreetingServiceResult> => {
    // The remote greeting service supports more languages.
    const greetings = {
      [Language.ENGLISH]: 'Hello, world',
      [Language.CHINESE]: '你好，世界',
      [Language.FRENCH]: 'Bonjour, monde',
      [Language.SPANISH]: 'Hola mundo',
      [Language.PORTUGUESE]: 'Olá mundo',
      [Language.ARABIC]: 'مرحبا بالعالم',
      [Language.HINDI]: 'नमस्ते दुनिया',
    };
    await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate a network call
    return { greeting: greetings[language] };
  },
};

const { callGreetingService } = wf.proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});
