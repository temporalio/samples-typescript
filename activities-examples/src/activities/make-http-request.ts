import axios from 'axios';
import { fnThatThrows } from '../helpers';

export async function makeHTTPRequest(): Promise<string> {
  fnThatThrows();
  const res = await axios.get('http://httpbin.org/get?answer=42');

  return res.data.args.answer;
}
