// humanize-string and node-fetch are ESM libraries
import humanizeString from 'humanize-string';
import fetch from 'node-fetch';

import { ApplicationFailure } from '@temporalio/common';

export async function greetHTTP(name: string): Promise<string> {
  const response = await fetch('http://httpbin.org/get?greeting=Hello');
  if (!response.ok) {
    throw ApplicationFailure.retryable(`HTTP error! status: ${response.status}`);
  }
  const body: any = await response.json();
  return `${body.args.greeting}, ${name}!`;
}

export async function greetLocal(name: string): Promise<string> {
  return humanizeString(`Hello-World-And-Hello-${name}!`, { preserveCase: true });
}
