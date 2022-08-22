import { NestFactory } from '@nestjs/core';
import { CounterWorkerModule } from './counter-worker/counter-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(CounterWorkerModule);
  await app.listen(3001);
}
bootstrap();
