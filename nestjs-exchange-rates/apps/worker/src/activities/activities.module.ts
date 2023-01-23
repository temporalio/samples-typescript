import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
