import { webcrypto as crypto } from 'node:crypto';

const CIPHER = 'AES-GCM';
const IV_LENGTH_BYTES = 12;
const TAG_LENGTH_BYTES = 16;

type EncryptInput = { data: Uint8Array; key: crypto.CryptoKey };
type DecryptInput = { encryptedData: Uint8Array; key: crypto.CryptoKey };

export async function encrypt({ data, key }: EncryptInput): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: CIPHER,
      iv,
      tagLength: TAG_LENGTH_BYTES * 8,
    },
    key,
    data,
  );

  return Buffer.concat([iv, new Uint8Array(encrypted)]);
}

export async function decrypt({ encryptedData, key }: DecryptInput): Promise<Uint8Array> {
  const iv = encryptedData.subarray(0, IV_LENGTH_BYTES);
  const ciphertext = encryptedData.subarray(IV_LENGTH_BYTES);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: CIPHER,
      iv,
      tagLength: TAG_LENGTH_BYTES * 8,
    },
    key,
    ciphertext,
  );

  return new Uint8Array(decrypted);
}
