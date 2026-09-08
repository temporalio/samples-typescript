import * as nexus from 'nexus-rpc';
import * as temporalNexus from '@temporalio/nexus';
import * as activities from './activities';
import { GreetInput, greetingService } from './api';

function activityIdForGreeting(input: GreetInput): string {
  return `greeting-${input.name}`;
}

export const greetingServiceHandler = nexus.serviceHandler(greetingService, {
  greet: new temporalNexus.TemporalOperationHandler({
    async start(_ctx, client, input) {
      return await client.typedActivity<typeof activities>().startActivity('greet', {
        // Use a business identifier from the Operation input so callers can identify the
        // same Activity independently of any individual Nexus request.
        id: activityIdForGreeting(input),
        args: [input],
        startToCloseTimeout: '10s',
      });
    },
  }),
});
