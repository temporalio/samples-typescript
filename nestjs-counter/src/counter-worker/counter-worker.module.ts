import { ActivitiesModule } from '../activities/activities.module';
import { Module } from '@nestjs/common';
import { counterWorkerProviders } from './counter-worker.providers';
import { CounterWorkerService } from './counter-worker.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [],
  providers: [...counterWorkerProviders, CounterWorkerService],
})
export class CounterWorkerModule {}
