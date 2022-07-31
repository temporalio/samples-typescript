import { Module } from '@nestjs/common';
import { ActivitiesModule } from './activities/activities.module';
import { CounterWorkflowModule } from './counter-workflow/counter-workflow.module';
import { CounterWorkerModule } from './counter-worker/counter-worker.module';

@Module({
  imports: [ActivitiesModule, CounterWorkflowModule, CounterWorkerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
