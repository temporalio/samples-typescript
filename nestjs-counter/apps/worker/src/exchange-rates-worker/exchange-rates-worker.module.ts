import { ActivitiesModule } from '../activities/activities.module';
import { Module } from '@nestjs/common';
import { exchangeRatesWorkerProviders } from './exchange-rates-worker.providers';
import { ExchangeRatesWorkerService } from './exchange-rates-worker.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [],
  providers: [...exchangeRatesWorkerProviders, ExchangeRatesWorkerService],
})
export class ExchangeRatesWorkerModule {}
