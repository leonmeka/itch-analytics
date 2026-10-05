import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';

import { TOKEN_ENC_KEY } from '../auth.constants';

const VERSION = 'v1';

@Injectable()
export class TokenCipherService {
  private readonly key: Buffer;

  constructor(@Inject(TOKEN_ENC_KEY) encKey: string) {
    this.key = createHash('sha256').update(encKey).digest();
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${VERSION}.${iv.toString('base64url')}.${tag.toString('base64url')}.${data.toString('base64url')}`;
  }

  decrypt(payload: string): string {
    const [version, ivRaw, tagRaw, dataRaw] = payload.split('.');

    if (version !== VERSION || !ivRaw || !tagRaw || !dataRaw) {
      throw new Error('Unknown token payload format');
    }

    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivRaw, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(dataRaw, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
