import { sleep, heartbeat, log } from '@temporalio/activity';
import { greetService } from './testService';

export async function greet(name: string): Promise<string> {
  // do an infinite loop until the service is ready
  for (;;) {
    try {
      const greeting = await greetService(name);
      return greeting;
    } catch (err) {
      log.error(String(err));
    }
    heartbeat('invoking activity');
    await sleep(1 * 1000);
  }
}
