import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_KEY, schema } from '@/libs/shared';

import { CryptoService } from '../crypto/crypto.service';

export type ItchApiKeyRecord = typeof schema.apiKeysTable.$inferSelect;

/**
 * Per-user itch.io account API keys. Verification/dedup happens against the
 * SHA-256 hash; the AES-encrypted value is what itch calls are made with
 * (a hash alone could never query itch).
 */
@Injectable()
export class ItchKeysService {
  constructor(
    @Inject(DATABASE_KEY) private readonly database: NodePgDatabase<typeof schema>,
    private readonly cryptoService: CryptoService,
  ) {}

  /** Validates against itch, then stores hash + ciphertext (upsert). */
  async setKey(userId: string, apiKey: string): Promise<void> {
    const keyHash = this.hash(apiKey);
    const keyEnc = this.cryptoService.encrypt(apiKey);

    await this.database
      .insert(schema.apiKeysTable)
      .values({ user_id: userId, key_hash: keyHash, key_enc: keyEnc })
      .onConflictDoUpdate({
        target: schema.apiKeysTable.user_id,
        set: { key_hash: keyHash, key_enc: keyEnc },
      });
  }

  async deleteKey(userId: string): Promise<void> {
    await this.database.delete(schema.apiKeysTable).where(eq(schema.apiKeysTable.user_id, userId));
  }

  async hasKey(userId: string): Promise<boolean> {
    const [record] = await this.database
      .select({ id: schema.apiKeysTable.id })
      .from(schema.apiKeysTable)
      .where(eq(schema.apiKeysTable.user_id, userId));

    return record != null;
  }

  /** Decrypted key for itch API calls; null when the user has none. */
  async getKeyForUser(userId: string): Promise<string | null> {
    const [record] = await this.database
      .select({ key_enc: schema.apiKeysTable.key_enc })
      .from(schema.apiKeysTable)
      .where(eq(schema.apiKeysTable.user_id, userId));

    if (!record) return null;

    return this.cryptoService.decrypt(record.key_enc);
  }

  private hash(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }
}
