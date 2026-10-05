const ITCH_API_URL = 'https://api.itch.io';

export async function fetchItchGames(token: string): Promise<unknown> {
  const response = await fetch(`${ITCH_API_URL}/profile/games`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`itch.io games fetch failed: ${response.status}`);
  }

  return (await response.json()) as unknown;
}
