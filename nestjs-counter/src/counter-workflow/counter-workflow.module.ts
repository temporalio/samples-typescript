import { Module } from '@nestjs/common';
import { CounterWorkflowController } from './counter-workflow.controller';
import { CounterWorkflowService } from './counter-workflow.service';
import { counterWorkflowProviders } from './counter-workflow.providers';

@Module({
  imports: [],
  controllers: [CounterWorkflowController],
  providers: [...counterWorkflowProviders, CounterWorkflowService],
})
export class CounterWorkflowModule {}
