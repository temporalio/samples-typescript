import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class CounterWorkerService {
  constructor(@Inject('COUNTER_WORKER') private worker) {}

  async close() {
    await this.worker.close();
  }
}
