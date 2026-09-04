#!/usr/bin/env node
// セットアップの確認。トークンが生きているか、ユーザー ID が何かを表示する。
//   npm run check

import { loadConfig } from './lib/config.mjs';
import { fetchThreadsUser } from './lib/threads.mjs';
import { fetchInstagramUser, InstagramClient } from './lib/instagram.mjs';
import { checkPublicUrl } from './lib/http.mjs';
import { log } from './lib/log.mjs';

const config = loadConfig();
let failed = false;

log.info(`公開 URL の基点: ${config.publicBaseUrl}`);
const pages = await checkPublicUrl(`${config.publicBaseUrl}/index.html`);
if (pages.ok) {
  log.ok('GitHub Pages に到達できました。');
} else {
  log.error(`GitHub Pages に到達できません（HTTP ${pages.status}）。PUBLIC_BASE_URL を確認してください。`);
  failed = true;
}

// --- Threads ---
if (!config.threads.accessToken) {
  log.warn('Threads: THREADS_ACCESS_TOKEN が未設定です。');
} else {
  try {
    const me = await fetchThreadsUser(config.threads);
    log.ok(`Threads: @${me.username}（THREADS_USER_ID = ${me.id}）`);
    if (config.threads.userId && config.threads.userId !== me.id) {
      log.error(`  THREADS_USER_ID が ${config.threads.userId} になっています。${me.id} に直してください。`);
      failed = true;
    }
  } catch (err) {
    log.error(`Threads: ${err.message}`);
    failed = true;
  }
}

// --- Instagram ---
if (!config.instagram.accessToken) {
  log.warn('Instagram: IG_ACCESS_TOKEN が未設定です。');
} else {
  try {
    const me = await fetchInstagramUser(config.instagram);
    log.ok(`Instagram: @${me.username}（IG_USER_ID = ${me.id}, 種別 ${me.account_type || '不明'}）`);
    if (config.instagram.userId && config.instagram.userId !== me.id) {
      log.error(`  IG_USER_ID が ${config.instagram.userId} になっています。${me.id} に直してください。`);
      failed = true;
    }
    if (me.account_type && !['BUSINESS', 'MEDIA_CREATOR', 'CREATOR'].includes(me.account_type)) {
      log.error('  個人アカウントでは API 投稿ができません。プロアカウントに切り替えてください。');
      failed = true;
    }
    const limit = await new InstagramClient({ ...config.instagram, userId: me.id }).publishingLimit();
    if (limit) log.info(`  直近 24 時間の API 投稿数: ${limit.used} / ${limit.total ?? '?'}`);
  } catch (err) {
    log.error(`Instagram: ${err.message}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
