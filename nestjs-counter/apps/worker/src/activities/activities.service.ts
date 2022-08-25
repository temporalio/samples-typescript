import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

const url = 'https://cdn.moneyconvert.net/api/latest.json';

@Injectable()
export class ActivitiesService {
  constructor(private readonly httpService: HttpService) {}

  async getExchangeRates(): Promise<any> {
    const res = await this.httpService.axiosRef.get(url);
    return res.data.rates;
  }
}
