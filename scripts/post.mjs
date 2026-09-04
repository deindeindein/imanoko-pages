#!/usr/bin/env node
// 予約投稿ランナー。公開時刻を過ぎた投稿を Instagram / Threads へ流す。
//
//   node scripts/post.mjs              # 通常実行
//   node scripts/post.mjs --dry-run    # API を叩かず、何が投稿されるかだけ表示
//   node scripts/post.mjs --file content/posts/2026-09-10-hello.md --force
//
// 冪等性: 投稿に成功した時点で前付けに posted_threads / posted_instagram を書き戻す。
// 同じファイルを再実行しても、ID が入っている投稿先へは二重投稿しない。

import { appendFileSync } from 'node:fs';
import { loadQueue, updateFrontMatter, toPublicUrl, formatJst, inferMediaKind } from './lib/queue.mjs';
import { validatePost } from './lib/validate.mjs';
import { loadConfig, credentialsFor } from './lib/config.mjs';
import { ThreadsClient } from './lib/threads.mjs';
import { InstagramClient } from './lib/instagram.mjs';
import { checkPublicUrl } from './lib/http.mjs';
import { log } from './lib/log.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const onlyFile = (() => {
  const i = args.indexOf('--file');
  return i !== -1 ? args[i + 1] : null;
})();

const config = loadConfig();
const now = new Date();
const summary = [];

function note(line) {
  summary.push(line);
}

const { posts, errors: parseErrors } = await loadQueue();

if (parseErrors.length > 0) {
  for (const { file, message } of parseErrors) log.error(`${file}: ${message}`);
  log.error('前付けを解釈できないファイルがあるため中止します。npm run validate で確認してください。');
  process.exit(1);
}

let due = posts.filter((p) => p.status === 'scheduled' || p.status === 'partial');
if (onlyFile) {
  due = due.filter((p) => p.file === onlyFile || p.file.endsWith(`/${onlyFile}`));
  if (due.length === 0) {
    log.error(`${onlyFile} は見つからないか、すでに投稿済み・停止中です`);
    process.exit(1);
  }
} else if (!force) {
  due = due.filter((p) => p.publishAt <= now);
}

if (due.length === 0) {
  log.info('公開時刻を過ぎた投稿はありません。');
  writeSummary(['今回の実行では投稿はありませんでした。']);
  process.exit(0);
}

const targets = due.slice(0, config.maxPostsPerRun);
if (due.length > targets.length) {
  log.warn(`${due.length} 件が対象ですが、1 回の実行では ${config.maxPostsPerRun} 件までにします。`);
}

log.info(`対象 ${targets.length} 件 / 現在時刻 ${formatJst(now)}`);

const clients = {};
function clientFor(platform) {
  if (clients[platform]) return clients[platform];
  const creds = credentialsFor(config, platform);
  if (creds.missing.length > 0) {
    throw new Error(`${platform}: 環境変数が未設定です（${creds.missing.join(', ')}）`);
  }
  clients[platform] =
    platform === 'threads' ? new ThreadsClient(creds) : new InstagramClient(creds);
  return clients[platform];
}

let failures = 0;

for (const post of targets) {
  log.info('─'.repeat(60));
  log.info(`${post.file}（予定 ${formatJst(post.publishAt)}）`);

  const lateMin = Math.round((now - post.publishAt) / 60000);
  if (lateMin > config.lateWarnMinutes) {
    log.warn(`予定より ${Math.floor(lateMin / 60)} 時間遅れています。`);
  }

  const { errors, warnings } = validatePost(post);
  for (const w of warnings) log.warn(`  ${w}`);
  if (errors.length > 0) {
    for (const e of errors) log.error(`  ${e}`);
    failures++;
    note(`❌ ${post.file}: 検証エラー — ${errors[0]}`);
    if (!dryRun) {
      await updateFrontMatter(post, { status: 'failed', last_error: `検証エラー: ${errors[0]}` });
    }
    continue;
  }

  const mediaUrls = post.media.map((ref) => toPublicUrl(ref, config.publicBaseUrl));
  const mediaKind = post.mediaKind || inferMediaKind(post.media[0] || '') || 'image';
  const pending = post.platforms.filter((p) => !post.postedIds[p]);

  if (pending.length === 0) {
    log.info('  すべての投稿先へ送信済みです。');
    continue;
  }

  if (dryRun) {
    log.info(`  [dry-run] 投稿先: ${pending.join(', ')}`);
    log.info(`  [dry-run] 本文: ${post.body.slice(0, 60).replace(/\n/g, ' ')}${post.body.length > 60 ? '…' : ''}`);
    for (const url of mediaUrls) log.info(`  [dry-run] メディア: ${url}`);
    note(`🔍 ${post.file}: ${pending.join(', ')} へ投稿予定`);
    continue;
  }

  // メディアは Meta 側が URL から取得するため、公開済みかを先に確かめる。
  let mediaReady = true;
  if (!config.skipUrlCheck) {
    for (const url of mediaUrls) {
      const res = await checkPublicUrl(url);
      if (!res.ok) {
        log.error(`  メディアが公開されていません（HTTP ${res.status}）: ${url}`);
        log.error('  GitHub Pages のデプロイが終わっていない可能性があります。');
        mediaReady = false;
      } else {
        log.ok(`  メディア確認: ${url}（${res.contentType}, ${(res.contentLength / 1024).toFixed(0)}KB）`);
      }
    }
  }

  if (!mediaReady) {
    const attempts = post.attempts + 1;
    const exhausted = attempts >= config.maxAttempts;
    await updateFrontMatter(post, {
      attempts,
      status: exhausted ? 'failed' : post.status,
      last_error: 'メディアの公開 URL に到達できませんでした',
    });
    failures++;
    note(`❌ ${post.file}: メディア URL に到達できません（${attempts}/${config.maxAttempts} 回目）`);
    continue;
  }

  const succeeded = {};
  const errorsByPlatform = {};

  for (const platform of pending) {
    try {
      const client = clientFor(platform);
      log.step(`  ${platform} へ投稿中…`);
      const result =
        platform === 'threads'
          ? await client.post({
              text: post.body,
              mediaUrls,
              mediaKind,
              alt: post.alt,
              link: post.link,
            })
          : await client.post({
              caption: post.body,
              mediaUrls,
              mediaKind,
              alt: post.alt,
            });
      succeeded[platform] = result;
      log.ok(`  ${platform}: 投稿しました（id=${result.id}）${result.permalink ? ` ${result.permalink}` : ''}`);
    } catch (err) {
      errorsByPlatform[platform] = err.message;
      log.error(`  ${platform}: ${err.message}`);
    }
  }

  const patch = {};
  for (const [platform, result] of Object.entries(succeeded)) {
    patch[`posted_${platform}`] = result.id;
    if (result.permalink) patch[`url_${platform}`] = result.permalink;
  }

  const allDone = post.platforms.every((p) => post.postedIds[p] || succeeded[p]);
  const failedPlatforms = Object.keys(errorsByPlatform);

  if (allDone) {
    patch.status = 'posted';
    patch.posted_at = formatJst(new Date());
    patch.last_error = null;
    patch.attempts = null;
    note(`✅ ${post.file}: ${Object.keys(succeeded).join(', ')} へ投稿しました`);
  } else {
    const attempts = post.attempts + 1;
    patch.attempts = attempts;
    patch.last_error = failedPlatforms.map((p) => `${p}: ${errorsByPlatform[p]}`).join(' / ').slice(0, 300);
    patch.status = attempts >= config.maxAttempts ? 'failed' : 'partial';
    failures++;
    note(
      `${patch.status === 'failed' ? '❌' : '⚠️'} ${post.file}: ${failedPlatforms.join(', ')} が失敗（${attempts}/${config.maxAttempts} 回目） — ${patch.last_error}`,
    );
  }

  await updateFrontMatter(post, patch);
}

writeSummary(summary);

if (failures > 0) {
  log.error(`${failures} 件で失敗しました。`);
  process.exit(1);
}
log.ok('完了しました。');

function writeSummary(lines) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file || lines.length === 0) return;
  const body = ['## 投稿結果', '', ...lines.map((l) => `- ${l}`), ''].join('\n');
  try {
    appendFileSync(file, body, 'utf8');
  } catch {
    /* サマリー出力は失敗しても本処理には影響させない */
  }
}
