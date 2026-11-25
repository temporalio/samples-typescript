import { PayloadCodec } from '@temporalio/common';
import { EncryptionCodec, NexusCodec } from './codec';

/** Sample configuration only; applications can supply their own maps and workflow codecs. */
export function createSampleCodec(role: 'caller' | 'compressed' | 'encrypted' = 'caller'): NexusCodec {
  // Hard-coded keys are demonstration values, separate from their public key IDs.
  const endpointCodecs = new Map<string, PayloadCodec>();
  if (role === 'caller' || role === 'compressed') {
    endpointCodecs.set(
      'nexus-serialization-compressed-encrypted-1',
      new EncryptionCodec('compressed-encrypted-1', 'handler-a-key-01', true),
    );
    endpointCodecs.set(
      'nexus-serialization-compressed-encrypted-2',
      new EncryptionCodec('compressed-encrypted-2', 'handler-a-key-02', true),
    );
  }
  if (role === 'caller' || role === 'encrypted') {
    endpointCodecs.set('nexus-serialization-encrypted-1', new EncryptionCodec('encrypted-1', 'handler-b-key-01'));
    endpointCodecs.set('nexus-serialization-encrypted-2', new EncryptionCodec('encrypted-2', 'handler-b-key-02'));
  }

  let workflowCodec: PayloadCodec;
  switch (role) {
    case 'caller':
      workflowCodec = new EncryptionCodec('caller-workflow', 'sample-key-C-123');
      break;
    case 'compressed':
      workflowCodec = new EncryptionCodec('compressed-encrypted-1', 'handler-a-key-01');
      break;
    case 'encrypted':
      workflowCodec = new EncryptionCodec('encrypted-1', 'handler-b-key-01');
      break;
  }
  return new NexusCodec(endpointCodecs, workflowCodec);
}
