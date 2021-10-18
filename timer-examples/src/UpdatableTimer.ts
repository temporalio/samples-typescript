// @@@SNIPSTART nodejs-updatable-timer-impl
import { defineSignal, defineQuery, setListener, condition } from '@temporalio/workflow';

// usage
export const addTimeSignal = defineSignal<[number]>('addTime');
export const timeLeftQuery = defineQuery<number>('timeLeft');

export async function countdownWorkflow(): Promise<void> {
  const target = Date.now() + 10000;
  const timer = new UpdatableTimer(target);
  console.log('timer set for: ' + target.toString());
  setListener(addTimeSignal, (deadline) => {
    // send in new deadlines via Signal
    timer.deadline = deadline
    console.log('timer now set for: ' + new Date(deadline).toString());
  }); 
  setListener(timeLeftQuery, () => timer.deadline - Date.now())
  await timer;
  console.log('countdown done!')
}

// implementation
export class UpdatableTimer implements PromiseLike<void> {
  deadlineUpdated = false;
  deadline: number;
  constructor(deadline: number) {
    this.deadline = deadline;
  }
  private async run(): Promise<void> {
    while (true) {
      this.deadlineUpdated = false;
      if (
        await condition(this.deadline - Date.now(), () => this.deadlineUpdated)
      ) {
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
  // javascript class setter
  addTime(value: number) {
    this.deadline += value;
    this.deadlineUpdated = true;
  }
}
// @@@SNIPEND