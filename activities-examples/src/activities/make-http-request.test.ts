import axios from 'axios';
import { makeHTTPRequest } from './index';

jest.mock('axios');
const mockedAxios = jest.mocked(axios, true);

test('makeHTTPRequest works', async () => {
  mockedAxios.get.mockResolvedValue({ data: { args: { answer: '88' } } });
  const result = await makeHTTPRequest();
  expect(result).toBe('88');
});
