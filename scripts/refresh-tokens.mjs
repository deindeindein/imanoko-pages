#!/usr/bin/env node
// アクセストークンの交換・更新。
//
//   npm run token:exchange   # 短期トークン → 長期トークン（初回セットアップ）
//   npm run token:refresh    # 長期トークンの有効期限を延長（60日ごと）
//
// GitHub Actions では、GH_SECRETS_TOKEN（Secrets の書き込み権限を持つ PAT）があれば
// 更新後のトークンを Actions Secrets へ書き戻す。無ければ Issue で期限を知らせる。

import { getJson } from './lib/http.mjs';
import { loadConfig } from './lib/config.mjs';
import { log } from './lib/log.mjs';

const exchange = process.argv.includes('--exchange');
const config = loadConfig();

const SERVICES = [
  {
    key: 'threads',
    label: 'Threads',
    secretName: 'THREADS_ACCESS_TOKEN',
    host: config.threads.base,
    appSecret: config.threads.appSecret,
    token: config.threads.accessToken,
    exchangeGrant: 'th_exchange_token',
    refreshGrant: 'th_refresh_token',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    secretName: 'IG_ACCESS_TOKEN',
    host: config.instagram.base,
    appSecret: config.instagram.appSecret,
    token: config.instagram.accessToken,
    exchangeGrant: 'ig_exchange_token',
    refreshGrant: 'ig_refresh_token',
  },
];

function mask(token) {
  if (!token) return '(なし)';
  return `${token.slice(0, 8)}…${token.slice(-6)}（${token.length} 文字）`;
}

function daysFrom(seconds) {
  return Math.round(Number(seconds || 0) / 86400);
}

const results = [];

for (const svc of SERVICES) {
  if (!svc.token) {
    log.warn(`${svc.label}: ${svc.secretName} が未設定のため飛ばします。`);
    continue;
  }

  const host = svc.host.replace(/\/+$/, '');
  try {
    let body;
    if (exchange) {
      if (!svc.appSecret) {
        log.error(`${svc.label}: 短期→長期の交換には ${svc.key === 'threads' ? 'THREADS' : 'IG'}_APP_SECRET が必要です。`);
        process.exitCode = 1;
        continue;
      }
      body = await getJson(`${host}/access_token`, {
        grant_type: svc.exchangeGrant,
        client_secret: svc.appSecret,
        access_token: svc.token,
      }, { label: `${svc.key}:exchange` });
    } else {
      body = await getJson(`${host}/refresh_access_token`, {
        grant_type: svc.refreshGrant,
        access_token: svc.token,
      }, { label: `${svc.key}:refresh` });
    }

    const days = daysFrom(body.expires_in);
    log.ok(`${svc.label}: 新しいトークンを取得しました（有効期限 約${days} 日）`);
    log.info(`  ${svc.secretName} = ${mask(body.access_token)}`);
    results.push({ ...svc, newToken: body.access_token, days });
  } catch (err) {
    log.error(`${svc.label}: ${err.message}`);
    results.push({ ...svc, error: err.message });
    process.exitCode = 1;
  }
}

const updated = results.filter((r) => r.newToken);
const failed = results.filter((r) => r.error);

// --- GitHub Actions への書き戻し / 通知 ---------------------------------

const repo = process.env.GITHUB_REPOSITORY || '';
const secretsToken = process.env.GH_SECRETS_TOKEN || '';
const notifyToken = secretsToken || process.env.GITHUB_TOKEN || '';

if (!process.env.GITHUB_ACTIONS) {
  if (updated.length > 0) {
    log.info('');
    log.info('手元で実行した場合は、上のトークンを GitHub の Settings → Secrets and variables → Actions に貼り替えてください。');
    log.info('（値そのものはログに出していません。--print-token を付けると表示します）');
    if (process.argv.includes('--print-token')) {
      for (const r of updated) console.log(`${r.secretName}=${r.newToken}`);
    }
  }
  process.exit(process.exitCode || 0);
}

if (secretsToken && repo && updated.length > 0) {
  try {
    await writeSecrets(repo, secretsToken, updated);
    log.ok('Actions Secrets を更新しました。');
  } catch (err) {
    log.error(`Secrets の更新に失敗しました: ${err.message}`);
    await notifyIssue(repo, notifyToken, updated, failed, err.message);
    process.exitCode = 1;
  }
} else {
  await notifyIssue(repo, notifyToken, updated, failed, null);
}

async function writeSecrets(repository, token, entries) {
  const sodium = (await import('libsodium-wrappers')).default;
  await sodium.ready;

  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  };

  const keyRes = await fetch(`https://api.github.com/repos/${repository}/actions/secrets/public-key`, { headers });
  if (!keyRes.ok) throw new Error(`公開鍵の取得に失敗: HTTP ${keyRes.status}`);
  const { key, key_id: keyId } = await keyRes.json();

  for (const entry of entries) {
    const sealed = sodium.crypto_box_seal(
      sodium.from_string(entry.newToken),
      sodium.from_base64(key, sodium.base64_variants.ORIGINAL),
    );
    const res = await fetch(`https://api.github.com/repos/${repository}/actions/secrets/${entry.secretName}`, {
      method: 'PUT',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL),
        key_id: keyId,
      }),
    });
    if (!res.ok) throw new Error(`${entry.secretName} の更新に失敗: HTTP ${res.status}`);
    log.ok(`  ${entry.secretName} を更新しました。`);
  }
}

async function notifyIssue(repository, token, ok, ng, writeError) {
  if (!token || !repository) {
    log.warn('GITHUB_TOKEN が無いため Issue 通知は行いません。');
    return;
  }
  const title = 'SNS 自動投稿: アクセストークンの更新が必要です';
  const lines = [
    '自動投稿ワークフローのアクセストークンについてのお知らせです。',
    '',
  ];
  if (ng.length > 0) {
    lines.push('### 更新に失敗したもの', '');
    for (const r of ng) lines.push(`- **${r.label}** (\`${r.secretName}\`): ${r.error}`);
    lines.push('', 'トークンが失効している可能性があります。`docs/social-automation.md` の手順でトークンを取り直してください。', '');
  }
  if (ok.length > 0 && writeError) {
    lines.push('### 更新はできたが Secrets へ書き戻せなかったもの', '');
    for (const r of ok) lines.push(`- **${r.label}** (\`${r.secretName}\`): 有効期限 約${r.days} 日`);
    lines.push('', `理由: ${writeError}`, '');
  }
  if (ok.length > 0 && !writeError && !secretsToken) {
    lines.push('### 手動での貼り替えが必要です', '');
    for (const r of ok) lines.push(`- **${r.label}** (\`${r.secretName}\`): 更新後の有効期限 約${r.days} 日`);
    lines.push(
      '',
      '`GH_SECRETS_TOKEN`（Secrets 書き込み権限のある PAT）が未設定のため、新しいトークンを Secrets へ自動保存できません。',
      '手元で `npm run token:refresh -- --print-token` を実行し、表示された値を Settings → Secrets and variables → Actions に貼り替えてください。',
      '',
      '自動化したい場合は `docs/social-automation.md` の「トークンの自動更新」を参照してください。',
      '',
    );
  }
  if (lines.length <= 2) {
    log.info('通知することはありません。');
    return;
  }

  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'content-type': 'application/json',
  };
  const body = lines.join('\n');

  const searchRes = await fetch(
    `https://api.github.com/repos/${repository}/issues?state=open&labels=social-token&per_page=1`,
    { headers },
  );
  const existing = searchRes.ok ? await searchRes.json() : [];

  if (Array.isArray(existing) && existing.length > 0) {
    await fetch(`https://api.github.com/repos/${repository}/issues/${existing[0].number}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });
    log.info(`既存の Issue #${existing[0].number} にコメントしました。`);
  } else {
    const res = await fetch(`https://api.github.com/repos/${repository}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, body, labels: ['social-token'] }),
    });
    if (res.ok) {
      const issue = await res.json();
      log.info(`Issue #${issue.number} を作りました。`);
    } else {
      log.warn(`Issue の作成に失敗しました: HTTP ${res.status}`);
    }
  }
}
