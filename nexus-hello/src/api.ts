// @@@SNIPSTART typescript-nexus-hello-service
import * as nexus from 'nexus-rpc';

export const helloService = nexus.service('hello', {
  /**
   * Return the input message, unmodified. In the present sample, this Operation
   * will be implemented using the Synchronous Nexus Operation handler syntax.
   */
  echo: nexus.operation<EchoInput, EchoOutput>(),

  /**
   * Return a salutation message, in the requested language. In the present sample,
   * this Operation will be implemented by starting the `helloWorkflow` Workflow.
   */
  hello: nexus.operation<HelloInput, HelloOutput>(),
});

export interface EchoInput {
  message: string;
}

export interface EchoOutput {
  message: string;
}

export interface HelloInput {
  name: string;
  language: LanguageCode;
}

export interface HelloOutput {
  message: string;
}

export type LanguageCode = 'en' | 'fr' | 'de' | 'es' | 'tr';
// @@@SNIPEND
