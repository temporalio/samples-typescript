import { Module } from '@nestjs/common';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
@Module({
  imports: [ExchangeRatesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
