import axios from 'axios';

type MakeHttpRequestResult = { answer: string };

export async function makeHTTPRequest(): Promise<MakeHttpRequestResult> {
  const res = await axios.get('http://httpbin.org/get?answer=42');

  return { answer: res.data.args.answer };
}
