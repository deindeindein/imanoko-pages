#!/usr/bin/env node
// 投稿ファイルのひな形を作る。
//   npm run new -- --at "2026-09-10 09:00" --slug newborn-hands --platforms threads,instagram --media media/hands.jpg

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { POSTS_DIR, parsePublishAt } from './lib/queue.mjs';
import { log } from './lib/log.mjs';

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function defaultAt() {
  // 明日の 9:00 JST
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const ymd = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(d);
  return `${ymd} 09:00`;
}

const at = arg('at', defaultAt());
const publishAt = parsePublishAt(at); // 形式が誤っていればここで落ちる
const slug = arg('slug', 'post').replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const platforms = arg('platforms', 'threads, instagram');
const media = arg('media', '');

const datePart = at.slice(0, 10);
const file = path.join(POSTS_DIR, `${datePart}-${slug}.md`);

if (existsSync(file)) {
  log.error(`${file} はすでにあります。--slug を変えてください。`);
  process.exit(1);
}

const lines = [
  '---',
  `publish_at: ${at}`,
  `platforms: ${platforms}`,
  `media: ${media}`,
  'alt: ',
  'status: scheduled',
  '---',
  '',
  'ここに本文を書きます。',
  '',
  '#いまのこ',
  '',
];

await mkdir(POSTS_DIR, { recursive: true });
await writeFile(file, lines.join('\n'), 'utf8');
log.ok(`${file} を作りました（公開予定 ${publishAt.toISOString()}）`);
if (!media) log.warn('Instagram に投稿するなら media が必須です。media/ に画像を置いて指定してください。');
