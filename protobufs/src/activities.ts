// @@@SNIPSTART typescript-protobuf-activity
import { foo, ProtoResult } from '../protos/root';

export async function protoActivity(input: foo.bar.ProtoInput): Promise<ProtoResult> {
  return ProtoResult.create({ sentence: `${input.name} is ${input.age} years old.` });
}
// @@@SNIPEND
