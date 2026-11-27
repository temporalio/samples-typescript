// humanize-string and node-fetch are ESM libraries
import humanizeString from 'humanize-string';
import fetch from 'node-fetch';

import { ApplicationFailure } from '@temporalio/common';

type GreetInput = { name: string };

export type GreetResult = { greeting: string };

export async function greetHTTP({ name }: GreetInput): Promise<GreetResult> {
  const response = await fetch('http://httpbin.org/get?greeting=Hello');
  if (!response.ok) {
    throw ApplicationFailure.retryable(`HTTP error! status: ${response.status}`);
  }
  const body: any = await response.json();
  return { greeting: `${body.args.greeting}, ${name}!` };
}

export async function greetLocal({ name }: GreetInput): Promise<GreetResult> {
  return { greeting: humanizeString(`Hello-World-And-Hello-${name}!`, { preserveCase: true }) };
}
