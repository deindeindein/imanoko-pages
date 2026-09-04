// Meta Graph 系 API 共通のリクエスト処理。
// エラー時は Meta が返す error オブジェクトをそのまま読める形にして投げる。

export class ApiError extends Error {
  constructor(message, { status, body, url } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

function describe(body) {
  const e = body && body.error;
  if (!e) return typeof body === 'string' ? body : JSON.stringify(body);
  const parts = [e.message || e.type || 'unknown error'];
  if (e.code !== undefined) parts.push(`code=${e.code}`);
  if (e.error_subcode !== undefined) parts.push(`subcode=${e.error_subcode}`);
  if (e.error_user_msg) parts.push(e.error_user_msg);
  return parts.join(' / ');
}

async function request(url, init, { attempts = 3, label = 'request' } = {}) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    let res;
    try {
      res = await fetch(url, init);
    } catch (err) {
      lastError = new ApiError(`${label}: ネットワークエラー: ${err.message}`, { url });
      if (i < attempts) {
        await sleep(2000 * 2 ** (i - 1));
        continue;
      }
      throw lastError;
    }

    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = text;
    }

    if (res.ok) return body;

    lastError = new ApiError(`${label}: HTTP ${res.status}: ${describe(body)}`, {
      status: res.status,
      body,
      url,
    });

    // 5xx と 429 のみ再試行する。4xx はリクエスト自体が誤っているので即座に返す。
    const retryable = res.status >= 500 || res.status === 429;
    if (!retryable || i === attempts) throw lastError;
    await sleep(2000 * 2 ** (i - 1));
  }
  throw lastError;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getJson(url, params = {}, opts = {}) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
  }
  return request(u.toString(), { method: 'GET' }, opts);
}

export async function postForm(url, params = {}, opts = {}) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') form.set(k, String(v));
  }
  return request(
    url,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    },
    opts,
  );
}

/** 公開 URL として実際に取得できるかを確認する（Pages の反映漏れ検出用）。 */
export async function checkPublicUrl(url) {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    // HEAD を受け付けないホストがあるため、その場合だけ GET で確認する。
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
    }
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      contentLength: Number(res.headers.get('content-length') || 0),
    };
  } catch (err) {
    return { ok: false, status: 0, error: err.message, contentType: '', contentLength: 0 };
  }
}
