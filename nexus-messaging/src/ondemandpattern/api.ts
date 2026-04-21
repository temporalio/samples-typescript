import * as nexus from 'nexus-rpc';

export const NEXUS_ENDPOINT = 'nexus-messaging-nexus-endpoint';
export const HANDLER_TASK_QUEUE = 'nexus-messaging-handler-task-queue';
export const HANDLER_NAMESPACE = 'nexus-messaging-handler-namespace';
export const CALLER_NAMESPACE = 'nexus-messaging-caller-namespace';

export const nexusRemoteGreetingService = nexus.service('NexusRemoteGreetingService', {
  /**
   * Starts a new GreetingWorkflow with the given workflowId (async WorkflowRunOperation).
   */
  runFromRemote: nexus.operation<RunFromRemoteInput, RunFromRemoteOutput>(),

  /**
   * Returns the list of all known languages for the given workflow.
   */
  getLanguages: nexus.operation<GetLanguagesInput, GetLanguagesOutput>(),

  /**
   * Returns the current greeting language for the given workflow.
   */
  getLanguage: nexus.operation<GetLanguageInput, GetLanguageOutput>(),

  /**
   * Sets the greeting language for the given workflow via an update.
   */
  setLanguage: nexus.operation<SetLanguageInput, SetLanguageOutput>(),

  /**
   * Approves (completes) the given workflow via a signal.
   */
  approve: nexus.operation<ApproveInput, void>(),
});

export type Language = 'arabic' | 'chinese' | 'english' | 'french' | 'hindi' | 'portuguese' | 'spanish';

export interface RunFromRemoteInput {
  userId: string;
}

export type RunFromRemoteOutput = string;

export interface GetLanguagesInput {
  userId: string;
}

export type GetLanguagesOutput = Language[];

export interface GetLanguageInput {
  userId: string;
}

export type GetLanguageOutput = Language;

export interface SetLanguageInput {
  userId: string;
  language: Language;
}

export type SetLanguageOutput = Language;

export interface ApproveInput {
  userId: string;
}
