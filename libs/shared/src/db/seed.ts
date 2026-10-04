import { resolve } from 'node:path';
import { config as loadEnvironment } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { reset, seed } from 'drizzle-seed';
import { Pool } from 'pg';

import { schema } from './db.inference';

loadEnvironment({ path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')] });

if (!process.env.API_DATABASE_URL) {
  throw new Error('API_DATABASE_URL is not set — run via the root .env (pnpm db:seed)');
}

const HANDLE_HEADS = [
  'pixel',
  'neon',
  'rusty',
  'cosmic',
  'void',
  'lunar',
  'hyper',
  'retro',
  'ghost',
  'ember',
  'frost',
  'moss',
  'glitch',
  'solar',
  'iron',
  'wild',
  'dusk',
  'quantum',
  'silent',
  'paper',
];
const HANDLE_TAILS = ['forge', 'dreamer', 'owl', 'cat', 'foundry', 'labs', 'grove'];
const HANDLES = HANDLE_HEADS.flatMap((head) => HANDLE_TAILS.map((tail) => `${head}-${tail}`));
const STUDIO_NAMES = [
  'Pixel Forge',
  'Neon Owl Labs',
  'Rusty Anvil',
  'Void Moth',
  'Cosmic Cat Foundry',
  'Lunar Grove',
  'Hyper Drift Works',
  'Retro Harbor',
  'Ghost Signal',
  'Ember Wren Studio',
  'Frost Garden',
  'Moss Circuit',
  'Glitch Bloom',
  'Solar Pebble',
  'Iron Jelly Games',
  'Wild Anvil',
  'Dusk Cat Labs',
  'Quantum Owl',
  'Silent Forge',
  'Paper Foundry',
];
const GAME_NAMES = [
  'Neon Drift',
  'Garden Witch',
  'Rustbelt Runner',
  'Void Café',
  'Crescent Harbor',
  'Paper Kingdom',
  'Ember Grove',
  'Frost Circuit',
  'Midnight Cove',
  'Hollow Fields',
  'Sunken Machina',
  'Chrome Orchard',
  'Wildwood Voyage',
  'Glass Foundry',
  'Iron Sprawl',
  'Sugar Tides',
  'Static Vault',
  'Amber Letters',
  'Cobalt Signal',
  'Salt Winds',
  'Moonlight Depot',
  'Lantern Bay',
  'Feather Route',
  'Clay Kingdoms',
  'Echo Farm',
  'Bramble Court',
  'Tinder Peaks',
  'Copper Skies',
  'Marble Ghosts',
  'Slate Harbor',
  'Willow Engines',
  'Cinder Trails',
  'Opal Ruins',
  'Harbor Lights',
  'Dusk Parliament',
  'Kite Weather',
  'Meadow Protocol',
  'Rune Bakery',
  'Thistle Navy',
  'Vapor Trails',
  'Neon Drift OST',
  'Garden Witch Demo',
  'Void Café II',
  'Harbor Lights Remastered',
];
const COUNTRIES = [
  'US',
  'US',
  'US',
  'US',
  'US',
  'DE',
  'DE',
  'DE',
  'DE',
  'GB',
  'GB',
  'GB',
  'GB',
  'CA',
  'CA',
  'CA',
  'FR',
  'FR',
  'FR',
  'JP',
  'JP',
  'JP',
  'PL',
  'PL',
  'ES',
  'ES',
  'IT',
  'IT',
  'BR',
  'BR',
  'AU',
  'AU',
  'NL',
  'NL',
  'SE',
  'KR',
  'MX',
  'FI',
  'NO',
  'DK',
  'AT',
  'CH',
  'TR',
  'IN',
];
const PRICE_TIERS = [199, 299, 399, 499, 599, 799, 999, 1499, 1999, 2999];
const AVATARS = Array.from(
  { length: 60 },
  (_, index) => `https://picsum.photos/seed/itch-${index}/96`,
);

const seededAt = new Date();

const tables = {
  usersTable: schema.usersTable,
  oauthIdentitiesTable: schema.oauthIdentitiesTable,
  paymentsTable: schema.paymentsTable,
};

async function main() {
  const pool = new Pool({ connectionString: process.env.API_DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    console.log('Resetting tables (TRUNCATE users CASCADE) — all existing data is wiped…');
    await reset(db, tables);

    await seed(db, tables).refine((f) => ({
      usersTable: {
        count: 50,
        columns: {
          created_at: f.default({ defaultValue: seededAt }),
          updated_at: f.default({ defaultValue: seededAt }),
          role: f.valuesFromArray({ values: ['user'] }),
        },
        with: {
          oauthIdentitiesTable: 1,
          paymentsTable: [
            { weight: 0.6, count: [1, 2, 3] },
            { weight: 0.3, count: [4, 5, 6, 7, 8, 9, 10, 11, 12] },
            { weight: 0.1, count: [13, 14, 15, 16, 17, 18, 19, 20, 25, 30] },
          ],
        },
      },
      oauthIdentitiesTable: {
        columns: {
          created_at: f.default({ defaultValue: seededAt }),
          updated_at: f.default({ defaultValue: seededAt }),
          username: f.valuesFromArray({ values: HANDLES }),
          name: f.valuesFromArray({ values: STUDIO_NAMES }),
          avatar_url: f.valuesFromArray({ values: AVATARS }),
          provider_user_id: f.uuid(),
        },
      },
      paymentsTable: {
        columns: {
          created_at: f.default({ defaultValue: seededAt }),
          updated_at: f.default({ defaultValue: seededAt }),
          object_name: f.valuesFromArray({ values: GAME_NAMES }),
          source: f.valuesFromArray({ values: ['stripe', 'stripe', 'stripe', 'paypal'] }),
          country_code: f.valuesFromArray({ values: COUNTRIES }),
          donation: f.default({ defaultValue: null }),
          on_sale: f.default({ defaultValue: null }),
          product_price_cents: f.valuesFromArray({ values: PRICE_TIERS }),
          tax_added_cents: f.default({ defaultValue: 0 }),
          tip_cents: f.weightedRandom([
            { weight: 0.8, value: f.default({ defaultValue: 0 }) },
            { weight: 0.2, value: f.int({ minValue: 50, maxValue: 500 }) },
          ]),
          marketplace_fee_cents: f.int({ minValue: 20, maxValue: 350 }),
          source_fee_cents: f.int({ minValue: 10, maxValue: 160 }),
          payout: f.valuesFromArray({ values: ['payout_pending', 'paid'] }),
          amount_delivered_cents: f.int({ minValue: 100, maxValue: 3200 }),
          currency: f.default({ defaultValue: 'USD' }),
          source_id: f.default({ defaultValue: null }),
          customer_key: f.uuid(),
          purchased_at: f.date({ minDate: '2024-10-01', maxDate: '2026-10-01' }),
          amount_cents: f.weightedRandom([
            { weight: 0.5, value: f.int({ minValue: 199, maxValue: 999 }) },
            { weight: 0.3, value: f.int({ minValue: 1000, maxValue: 1999 }) },
            { weight: 0.2, value: f.int({ minValue: 2000, maxValue: 3499 }) },
          ]),
          external_id: f.uuid(),
        },
      },
    }));

    console.log('Seed complete: 50 simulated users with itch identities and payments.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
