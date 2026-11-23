import { expect, jest, test } from '@jest/globals';
import axios from 'axios';
import { makeHTTPRequest } from './index';

jest.mock('axios');
const mockedAxios = jest.mocked(axios);

test('makeHTTPRequest works', async () => {
  mockedAxios.get.mockResolvedValue({ data: { args: { answer: '88' } } });
  const result = await makeHTTPRequest();
  expect(result).toBe('88');
});
