/* Wire types mirrored from libs/protocol (kept type-only so no decorators ship). */

export type Health = { status: string };

export type ItchProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ItchEarning = {
  currency: string;
  amount: number;
  amount_formatted: string;
};

export type ItchGame = {
  id: string;
  url: string | null;
  title: string | null;
  short_text: string | null;
  cover_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string | null;
  min_price: number | null;
  views_count: number | null;
  downloads_count: number | null;
  purchases_count: number | null;
  earnings: ItchEarning[];
};

export type ItchCredentials = {
  type: 'key' | 'jwt' | null;
  scopes: string[];
  expires_at: string | null;
};

export type ItchClaimedReward = {
  id: string;
  shortcode: string | null;
  reward_id: string | null;
  reward_title: string | null;
  reward_type: string | null;
  claimed_at: string | null;
};

export type ItchClaimedRewards = {
  page: number;
  per_page: number;
  total_items: number;
  rewards: ItchClaimedReward[];
};

export type Payment = {
  id: string;
  object_name: string | null;
  amount: string | null;
  amount_cents: number | null;
  currency: string | null;
  source: string | null;
  purchased_at: string | null;
  donation: string | null;
  payout: string | null;
};

export type PaymentsImportResult = {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
};

export type MetricPoint = { date: string; value: number };

export type ItchGraphPoint = { date: string; count: number };

export type ItchGraphs = {
  views: ItchGraphPoint[];
  downloads: ItchGraphPoint[];
  purchases: ItchGraphPoint[];
};

export type MetricsOverview = {
  views_series: MetricPoint[];
  downloads_series: MetricPoint[];
  purchases_series: MetricPoint[];
};
