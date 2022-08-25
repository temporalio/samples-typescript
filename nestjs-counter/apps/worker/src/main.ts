import { NestFactory } from '@nestjs/core';
import { ExchangeRatesWorkerModule } from './exchange-rates-worker/exchange-rates-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(ExchangeRatesWorkerModule);
  await app.listen(3001);
}
bootstrap();
