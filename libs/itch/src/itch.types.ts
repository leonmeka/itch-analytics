export interface ItchRawGame {
  id?: number;
  url?: string;
  title?: string;
  cover_url?: string;
  published_at?: string;

  classification?: string;
  type?: string;

  views_count?: number;
  downloads_count?: number;
  purchases_count?: number;
  earns?: Record<string, number>;
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

export interface ItchGame {
  id: string;
  url: string | null;
  title: string | null;
  cover_url: string | null;
  published_at: string | null;
  views_count: number | null;
  downloads_count: number | null;
}

export interface ItchRawGamesResponse {
  games?: ItchRawGame[];
}
