export const CALLER = 'nexus-serialization-caller';
export const COMPRESSED_HANDLER = 'nexus-serialization-compressed-encrypted-handler';
export const ENCRYPTED_HANDLER = 'nexus-serialization-encrypted-handler';
export const ENDPOINTS = [
  'nexus-serialization-compressed-encrypted-1',
  'nexus-serialization-encrypted-1',
  'nexus-serialization-compressed-encrypted-2',
  'nexus-serialization-encrypted-2',
] as const;

export type EndpointResults = Record<string, { sync: string; async: string }>;
