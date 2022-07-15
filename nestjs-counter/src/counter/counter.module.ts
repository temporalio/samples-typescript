import { Module } from '@nestjs/common';
import { CounterController } from './counter.controller';
import { CounterService } from './counter.service';
import { temporalProviders } from './counter-workflow.providers';

@Module({
  imports: [],
  controllers: [CounterController],
  providers: [...temporalProviders, CounterService],
})
export class CounterModule {}
