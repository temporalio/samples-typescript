// @@@SNIPSTART typescript-protobuf-workflow
import { proxyActivities } from '@temporalio/workflow';
import { foo, ProtoResult } from '../protos/root';
import type * as activities from './activities';

const { protoActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function example(input: foo.bar.ProtoInput): Promise<ProtoResult> {
  const result = await protoActivity(input);
  return result;
}
// @@@SNIPEND
