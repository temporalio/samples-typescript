import { Injectable, Inject } from '@nestjs/common';
import { WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { getExchangeRatesQuery } from '@app/shared';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @Inject('EXCHANGE_RATES_WORKFLOW') private handle: WorkflowHandle,
  ) {}

  async getExchangeRates() {
    return this.handle.query(getExchangeRatesQuery);
  }
}

@Injectable()
export class ExchangeRatesWorkflowClient extends WorkflowClient {}
