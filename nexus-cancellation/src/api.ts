// @@@SNIPSTART typescript-nexus-cancellation-service
import * as nexus from 'nexus-rpc';

export const helloService = nexus.service('hello', {
  /**
   * Return a salutation message, in the requested language. In the present sample,
   * this Operation will be implemented by starting the `helloWorkflow` Workflow.
   * This operation can be cancelled via the caller workflow.
   */
  hello: nexus.operation<HelloInput, HelloOutput>(),
});

export interface HelloInput {
  name: string;
  language: LanguageCode;
}

export interface HelloOutput {
  message: string;
}

export type LanguageCode = 'en' | 'fr' | 'de' | 'es' | 'tr';
// @@@SNIPEND
