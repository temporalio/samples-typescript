import { NestFactory } from '@nestjs/core';
import { ExchangeRatesWorkerModule } from './exchange-rates-worker/exchange-rates-worker.module';
import { ExchangeRatesWorkerService } from './exchange-rates-worker/exchange-rates-worker.service';

async function bootstrap() {
  const app = await NestFactory.create(ExchangeRatesWorkerModule);
  await app.listen(3001);

  try {
    console.log('Started worker!');
    await app.get(ExchangeRatesWorkerService).run();
  } finally {
    await app.close();
  }
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
