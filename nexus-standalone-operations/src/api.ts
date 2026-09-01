import * as nexus from 'nexus-rpc';

export const myNexusService = nexus.service('myNexusService', {
  echo: nexus.operation<EchoInput, EchoOutput>(),
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
}

export interface HelloOutput {
  greeting: string;
}
