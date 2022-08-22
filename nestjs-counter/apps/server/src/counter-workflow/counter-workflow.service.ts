import { Injectable, Inject } from '@nestjs/common';
import { WorkflowHandle } from '@temporalio/client';
import { getValueQuery, incrementSignal } from '@app/shared';

@Injectable()
export class CounterWorkflowService {
  constructor(@Inject('COUNTER_WORKFLOW') private handle: WorkflowHandle) {}

  async getValue(): Promise<number> {
    return this.handle.query(getValueQuery);
  }

  async increment(value: number): Promise<void> {
    await this.handle.signal(incrementSignal, value);
  }
}
