export type CorsConfig = {
  origin: false | (string | RegExp)[];
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
};

export const CORS_CONFIG: CorsConfig = {
  origin: (process.env.API_CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: true,
};
