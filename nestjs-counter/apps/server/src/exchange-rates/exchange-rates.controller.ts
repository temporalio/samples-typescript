import { Controller, Get, Param } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get(':currency')
  async getExchangeRates(
    @Param('currency') currency: string,
  ): Promise<number | undefined> {
    const rates = await this.exchangeRatesService.getExchangeRates();

    if (rates === null) {
      return undefined;
    }

    return rates[currency];
  }
}
