import { Injectable, Inject } from '@nestjs/common';
import { WorkflowHandle } from '@temporalio/client';
import { getValueQuery, incrementSignal } from '../workflows';

@Injectable()
export class CounterService {
  constructor(@Inject('COUNTER_WORKFLOW') private handle: WorkflowHandle) {}

  async getValue(): Promise<number> {
    return this.handle.query(getValueQuery);
  }

  async increment(value: number): Promise<void> {
    await this.handle.signal(incrementSignal, value);
  }
}
