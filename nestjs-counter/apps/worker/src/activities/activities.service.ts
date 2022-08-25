import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ActivitiesService {
  async getExchangeRates(): Promise<any> {
    const res = await axios.get('https://cdn.moneyconvert.net/api/latest.json');
    return res.data.rates;
  }
}
