import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRatesService } from './exchange-rates.service';
import { exchangeRatesProviders } from './exchange-rates.providers';

describe('ExchangeRatesService', () => {
  let app: TestingModule;
  const rates = { AUD: 1.5 };

  beforeAll(async () => {
    const handleMock = {
      query: jest.fn(() => rates),
    };

    app = await Test.createTestingModule({
      providers: [...exchangeRatesProviders, ExchangeRatesService],
    })
      .overrideProvider('CONNECTION')
      .useValue(null)
      .overrideProvider('WORKFLOW_CLIENT')
      .useValue(null)
      .overrideProvider('EXCHANGE_RATES_WORKFLOW_HANDLE')
      .useValue(handleMock)
      .compile();
  });

  describe('ExchangeRatesService', () => {
    it('should return exchange rates', async () => {
      const exchangeRatesService = app.get(ExchangeRatesService);

      const rates = await exchangeRatesService.getExchangeRates();

      expect(rates).toEqual({ AUD: 1.5 });
    });
  });
});
