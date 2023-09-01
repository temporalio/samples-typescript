import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [ActivitiesService],
    }).compile();
  });

  describe('getExchangeRates', () => {
    it('should return exchange rates', async () => {
      const activitiesService = app.get(ActivitiesService);
      const httpService = activitiesService.httpService;
      jest.spyOn(httpService.axiosRef, 'get').mockImplementation(() =>
        Promise.resolve({
          data: {
            rates: { AUD: 1.14 },
          },
        })
      );

      const rates = await activitiesService.getExchangeRates();

      expect(rates).toEqual({ AUD: 1.14 });
    });
  });
});
