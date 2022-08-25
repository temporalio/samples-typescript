import { Module } from '@nestjs/common';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRatesService } from './exchange-rates.service';
import { exchangeRatesProviders } from './exchange-rates.providers';

@Module({
  imports: [],
  controllers: [ExchangeRatesController],
  providers: [...exchangeRatesProviders, ExchangeRatesService],
})
export class ExchangeRatesModule {}
