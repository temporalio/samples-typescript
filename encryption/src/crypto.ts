import crypto from 'crypto';

const CIPHER = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function encrypt(data: Uint8Array, key: Buffer): Promise<Uint8Array> {
  return new Promise(function (resolve) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(CIPHER, key, iv, { authTagLength: TAG_LENGTH });

    resolve(Buffer.concat([iv, cipher.update(data), cipher.final(), cipher.getAuthTag()]))
  });
}

export function decrypt(encryptedData: Uint8Array, key: Buffer): Promise<Uint8Array> {
  return new Promise(function (resolve) {
    const iv = encryptedData.subarray(0, IV_LENGTH);
    const ciphertext = encryptedData.subarray(IV_LENGTH, -TAG_LENGTH);
    const authTag = encryptedData.subarray(-TAG_LENGTH);

    const cipher = crypto.createDecipheriv(CIPHER, key, iv, { authTagLength: TAG_LENGTH });
    cipher.setAuthTag(authTag)

    resolve(Buffer.concat([cipher.update(ciphertext), cipher.final()]))
  });
}
