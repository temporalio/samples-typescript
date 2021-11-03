// TODO - incorporate into the starter
import { defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';

export const setDeadlineSignal = defineSignal<[number]>('setDeadline');
export const timeLeftQuery = defineQuery<number>('timeLeft');

// @@@SNIPSTART typescript-updatable-timer-impl
// usage
export async function countdownWorkflow(): Promise<void> {
  const target = Date.now() + 24 * 60 * 60 * 1000; // 1 day!!!
  const timer = new UpdatableTimer(target);
  console.log('timer set for: ' + new Date(target).toString());
  setHandler(setDeadlineSignal, (deadline) => {
    // send in new deadlines via Signal
    timer.deadline = deadline;
    console.log('timer now set for: ' + new Date(deadline).toString());
  });
  setHandler(timeLeftQuery, () => timer.deadline - Date.now());
  await timer; // if you send in a signal witha  new time, this timer will resolve earlier!
  console.log('countdown done!');
}

// implementation
export class UpdatableTimer implements PromiseLike<void> {
  deadlineUpdated = false;
  #deadline: number;

  constructor(deadline: number) {
    this.#deadline = deadline;
  }

  private async run(): Promise<void> {
    /* eslint-disable no-constant-condition */
    while (true) {
      this.deadlineUpdated = false;
      if (!(await condition(this.#deadline - Date.now(), () => this.deadlineUpdated))) {
        break;
      }
    }
  }

  then<TResult1 = void, TResult2 = never>(
    onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }

  set deadline(value: number) {
    this.#deadline = value;
    this.deadlineUpdated = true;
  }

  get deadline(): number {
    return this.#deadline;
  }
}
// @@@SNIPEND
