// @@@SNIPSTART typescript-nexus-hello-workflow
import { ApplicationFailure } from '@temporalio/workflow';
import { HelloInput, HelloOutput } from '../api';

export async function helloWorkflow(name: HelloInput): Promise<HelloOutput> {
  switch (name.language) {
    case 'en':
      return {
        message: `Hello, ${name.name}!`,
      };
    case 'fr':
      return {
        message: `Bonjour, ${name.name}!`,
      };
    case 'de':
      return {
        message: `Hallo, ${name.name}!`,
      };
    case 'es':
      return {
        message: `Hola, ${name.name}!`,
      };
    case 'tr':
      return {
        message: `Merhaba, ${name.name}!`,
      };
    default:
      throw new ApplicationFailure(`Unsupported language: ${name.language}`);
  }
}
// @@@SNIPEND
