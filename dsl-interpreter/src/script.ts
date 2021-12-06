// @ts-ignore
import { read } from 'node-yaml';
let dslInput;
async function run() {
  const path = process.argv[2];
  if (path) {
    dslInput = await read(path);
    console.log({ dslInput });
  }
}
run();
