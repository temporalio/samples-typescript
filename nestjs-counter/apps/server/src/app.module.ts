import { Module } from '@nestjs/common';
import { CounterWorkflowModule } from './counter-workflow/counter-workflow.module';
@Module({
  imports: [CounterWorkflowModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
