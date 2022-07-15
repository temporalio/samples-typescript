import { Module } from '@nestjs/common';
import { CounterModule } from './counter/counter.module';

@Module({
  imports: [CounterModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
