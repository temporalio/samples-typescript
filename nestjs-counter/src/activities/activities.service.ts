import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ActivitiesService {
  async persist(value: number): Promise<unknown> {
    const res = await axios.post('http://httpbin.org/post', { value });

    return res.data;
  }
}
