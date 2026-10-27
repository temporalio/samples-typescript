import { Injectable, Inject } from '@nestjs/common';
import { Worker } from '@temporalio/worker';

@Injectable()
export class ExchangeRatesWorkerService {
  constructor(@Inject('EXCHANGE_RATES_WORKER') private worker: Worker) {}

  run(): Promise<void> {
    return this.worker.run();
  }
}
