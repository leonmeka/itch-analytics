/* Wire types mirrored from libs/protocol (kept type-only so no decorators ship). */

export type Health = { status: string };

export type ItchProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ItchGame = {
  id: string;
  url: string | null;
  title: string | null;
  cover_url: string | null;
  published_at: string | null;
  views_count: number | null;
  downloads_count: number | null;
};

export type MetricPoint = { date: string; value: number };

export type MetricsOverview = {
  total_views: number;
  total_downloads: number;
  conversion_rate: number;
  views_series: MetricPoint[];
  downloads_series: MetricPoint[];
};
