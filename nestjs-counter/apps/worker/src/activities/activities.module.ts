import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
