import { Body, Controller, Get, Put } from '@nestjs/common';
import { CounterService } from './counter.service';

@Controller('counter')
export class CounterController {
  constructor(private readonly counterService: CounterService) {}

  @Get()
  async getCounter(): Promise<number> {
    return this.counterService.getValue();
  }

  @Put()
  async incrementCounter(@Body() body: { value: number }): Promise<boolean> {
    await this.counterService.increment(body.value);

    return true;
  }
}
