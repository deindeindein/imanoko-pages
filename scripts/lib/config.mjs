// 環境変数の読み取りと既定値。

const DEFAULT_PUBLIC_BASE_URL = 'https://deindeindein.github.io/imanoko-pages';

function num(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function loadConfig() {
  return {
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || DEFAULT_PUBLIC_BASE_URL).replace(/\/+$/, ''),
    maxPostsPerRun: num('MAX_POSTS_PER_RUN', 3),
    maxAttempts: num('MAX_ATTEMPTS', 3),
    lateWarnMinutes: num('LATE_WARN_MINUTES', 360),
    skipUrlCheck: process.env.SKIP_MEDIA_URL_CHECK === 'true',
    threads: {
      userId: process.env.THREADS_USER_ID || '',
      accessToken: process.env.THREADS_ACCESS_TOKEN || '',
      appSecret: process.env.THREADS_APP_SECRET || '',
      base: process.env.THREADS_API_BASE || 'https://graph.threads.net',
      version: process.env.THREADS_API_VERSION || 'v1.0',
    },
    instagram: {
      userId: process.env.IG_USER_ID || '',
      accessToken: process.env.IG_ACCESS_TOKEN || '',
      appSecret: process.env.IG_APP_SECRET || '',
      base: process.env.IG_API_BASE || 'https://graph.instagram.com',
      version: process.env.IG_API_VERSION || 'v23.0',
    },
  };
}

export function credentialsFor(config, platform) {
  const c = config[platform];
  const missing = [];
  const prefix = platform === 'threads' ? 'THREADS' : 'IG';
  if (!c.userId) missing.push(`${prefix}_USER_ID`);
  if (!c.accessToken) missing.push(`${prefix}_ACCESS_TOKEN`);
  return { ...c, missing };
}
