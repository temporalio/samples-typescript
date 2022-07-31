import { Body, Controller, Get, Put } from '@nestjs/common';
import { CounterWorkflowService } from './counter-workflow.service';

@Controller('counter')
export class CounterWorkflowController {
  constructor(
    private readonly counterWorkflowService: CounterWorkflowService,
  ) {}

  @Get()
  async getCounter(): Promise<number> {
    return this.counterWorkflowService.getValue();
  }

  @Put()
  async incrementCounter(@Body() body: { value: number }): Promise<boolean> {
    await this.counterWorkflowService.increment(body.value);

    return true;
  }
}
