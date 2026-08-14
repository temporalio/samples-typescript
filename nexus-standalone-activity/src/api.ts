import * as nexus from 'nexus-rpc';

export const greetingService = nexus.service('greetingService', {
  greet: nexus.operation<GreetInput, GreetOutput>(),
});

export interface GreetInput {
  name: string;
}

export interface GreetOutput {
  message: string;
}
