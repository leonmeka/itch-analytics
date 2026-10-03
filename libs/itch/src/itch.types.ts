export interface ItchRawGame {
  id?: number;
  url?: string;
  title?: string;
  short_text?: string;
  cover_url?: string;
  published_at?: string;
  created_at?: string;
  published?: boolean;

  classification?: string;
  type?: string;
  min_price?: number;

  views_count?: number;
  downloads_count?: number;
  purchases_count?: number;
  earnings?: ItchRawEarning[];
}

export interface ItchRawEarning {
  currency?: string;
  amount_formatted?: string;
  amount?: number;
}

export interface ItchRawProfile {
  user?: {
    id?: number;
    username?: string;
    url_name?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface ItchProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ItchEarning {
  currency: string;
  amount: number;
  amount_formatted: string;
}

export interface ItchGame {
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
}

export interface ItchRawGamesResponse {
  games?: ItchRawGame[];
}

export interface ItchCredentials {
  type: 'key' | 'jwt' | null;
  scopes: string[];
  expires_at: string | null;
}

export interface ItchRawCredentials {
  type?: string;
  scopes?: string[];
  expires_at?: string;
}

export interface ItchRawClaimedReward {
  id?: number;
  shortcode?: string;
  reward?: {
    id?: number;
    type?: string;
    title?: string;
  };
  purchase?: {
    created_at?: string;
    status?: string;
  };
}

export interface ItchClaimedReward {
  id: string;
  shortcode: string | null;
  reward_id: string | null;
  reward_title: string | null;
  reward_type: string | null;
  claimed_at: string | null;
}

export interface ItchClaimedRewards {
  page: number;
  per_page: number;
  total_items: number;
  rewards: ItchClaimedReward[];
}

export interface ItchRawClaimedRewardsResponse {
  page?: number;
  per_page?: number;
  total_items?: number;
  /** itch returns an empty OBJECT (not an array) when the list is empty. */
  claimed_rewards?: ItchRawClaimedReward[] | Record<string, never>;
}

/* Legacy itch.io/api/1 endpoints (semi-documented, still the only source for
 * dashboard graphs and per-game earnings). */

export interface ItchLegacyGraphPoint {
  date?: string;
  count?: number;
}

export interface ItchRawGraphsResponse {
  views?: ItchLegacyGraphPoint[] | Record<string, never>;
  downloads?: ItchLegacyGraphPoint[] | Record<string, never>;
  purchases?: ItchLegacyGraphPoint[] | Record<string, never>;
}

export interface ItchGraphPoint {
  date: string;
  count: number;
}

export interface ItchGraphs {
  views: ItchGraphPoint[];
  downloads: ItchGraphPoint[];
  purchases: ItchGraphPoint[];
}

/* Public page-data (https://{user}.itch.io/{game}/data.json) — includes the
 * sub-product catalog of a game when it has one (sub-product revenue itself
 * is not exposed by any itch API; see itch.service.enrichWithRevenue). */

export interface ItchSubProduct {
  id: number;
  name: string;
  price: string;
}

export interface ItchRawGameData {
  title?: string;
  sub_products?: Array<{ id?: number; name?: string; price?: string }>;
  errors?: string[];
}
