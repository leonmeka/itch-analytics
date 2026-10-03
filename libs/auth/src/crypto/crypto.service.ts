import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const ENCRYPTION_KEY = Symbol('ENCRYPTION_KEY');

/**
 * AES-256-GCM at-rest encryption for user-submitted secrets (itch.io API
 * keys). The key material comes from APP_ENCRYPTION_KEY (hashed to 32
 * bytes); ciphertext is stored as base64(iv|tag|payload).
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(@Inject(ENCRYPTION_KEY) encryptionKey: string) {
    this.key = createHash('sha256').update(encryptionKey).digest();
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const payload = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, payload]).toString('base64');
  }

  decrypt(encrypted: string): string | null {
    try {
      const raw = Buffer.from(encrypted, 'base64');
      const iv = raw.subarray(0, 12);
      const tag = raw.subarray(12, 28);
      const payload = raw.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);

      decipher.setAuthTag(tag);

      return Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8');
    } catch {
      return null;
    }
  }
}
