import crypto from '@ronomon/crypto-async';

const CIPHER = 'aes-256-gcm';

export function encrypt(data: Uint8Array, key: Buffer): Promise<Uint8Array> {
  return new Promise(function (resolve, reject) {
    const iv = Buffer.alloc(12);
    const aad = Buffer.alloc(256);
    const tag = Buffer.alloc(16);
    // eslint-disable-next-line
    // @ts-ignore
    crypto.cipher(
      CIPHER,
      crypto.CipherDirection.Encrypt,
      key,
      iv,
      Buffer.from(data),
      aad,
      tag,
      function (error: Error, encryptedData: Buffer) {
        if (error) {
          reject(error);
        }
        resolve(encryptedData);
      }
    );
  });
}

export function decrypt(encryptedData: Uint8Array, key: Buffer): Promise<Uint8Array> {
  return new Promise(function (resolve, reject) {
    const iv = Buffer.alloc(12);
    const aad = Buffer.alloc(256);
    const tag = Buffer.alloc(16);
    // eslint-disable-next-line
    // @ts-ignore
    crypto.cipher(
      CIPHER,
      crypto.CipherDirection.Encrypt,
      key,
      iv,
      Buffer.from(encryptedData),
      aad,
      tag,
      function (error: Error, decryptedData: Buffer) {
        if (error) {
          reject(error);
        }
        resolve(decryptedData);
      }
    );
  });
}
