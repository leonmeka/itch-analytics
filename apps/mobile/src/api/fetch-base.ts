export type ApiClientOptions = {
  baseUrl: string;
};

export async function fetchBase<TResponse>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  return (await response.json()) as TResponse;
}

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API request failed: ${status}`);
    this.name = 'ApiError';
  }
}
