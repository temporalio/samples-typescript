import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivitiesModule } from '../activities/activities.module';
import { exchangeRatesWorkerProviders } from './exchange-rates-worker.providers';
import { ExchangeRatesWorkerService } from './exchange-rates-worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ActivitiesModule,
  ],
  controllers: [],
  providers: [...exchangeRatesWorkerProviders, ExchangeRatesWorkerService],
})
export class ExchangeRatesWorkerModule {}
