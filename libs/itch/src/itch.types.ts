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
