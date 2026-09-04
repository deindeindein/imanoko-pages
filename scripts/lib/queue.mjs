// 投稿キュー（content/posts/*.md）の読み書き。
//
// ファイル形式:
//   ---
//   publish_at: 2026-09-10 09:00      # JST。オフセット付き ISO8601 も可
//   platforms: threads, instagram
//   media: media/2026-09-10-hands.jpg
//   alt: 生まれたばかりの赤ちゃんの手
//   ---
//   本文（Threads の text / Instagram の caption）
//
// 前付けは「key: value」の1行1組だけを扱う。ネストは使わない。

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const POSTS_DIR = 'content/posts';

export const PLATFORMS = ['threads', 'instagram'];
export const STATUSES = ['scheduled', 'posted', 'partial', 'failed', 'skipped'];

const IMAGE_EXT = ['.jpg', '.jpeg', '.png'];
const VIDEO_EXT = ['.mp4', '.mov'];

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontMatter(raw) {
  const match = raw.match(FRONT_MATTER_RE);
  if (!match) {
    throw new Error('前付け（--- で囲んだ部分）が見つかりません');
  }
  const [, block, body] = match;
  const data = {};
  const order = [];
  block.split(/\r?\n/).forEach((line, i) => {
    if (line.trim() === '' || line.trimStart().startsWith('#')) return;
    const sep = line.indexOf(':');
    if (sep === -1) {
      throw new Error(`前付け ${i + 1} 行目に「:」がありません: ${line}`);
    }
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    if (key === '') throw new Error(`前付け ${i + 1} 行目のキーが空です`);
    data[key] = value;
    if (!order.includes(key)) order.push(key);
  });
  return { data, order, body: body.replace(/^\r?\n/, '') };
}

export function serializeFrontMatter({ data, order, body }) {
  const keys = [...order.filter((k) => k in data), ...Object.keys(data).filter((k) => !order.includes(k))];
  const lines = keys.map((k) => `${k}: ${data[k]}`);
  return `---\n${lines.join('\n')}\n---\n\n${body.replace(/\s*$/, '')}\n`;
}

function splitList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 「2026-09-10 09:00」を JST として解釈する。オフセット付きならそのまま。 */
export function parsePublishAt(value) {
  if (!value) throw new Error('publish_at が空です');
  const trimmed = value.trim();
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(trimmed)) {
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) throw new Error(`publish_at を解釈できません: ${value}`);
    return d;
  }
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) {
    throw new Error(`publish_at は「YYYY-MM-DD HH:mm」形式で書いてください（例: 2026-09-10 09:00）: ${value}`);
  }
  const [, y, mo, d, h, mi] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:00+09:00`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error(`publish_at を解釈できません: ${value}`);
  return date;
}

export function formatJst(date) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
  return `${parts.replace(' ', 'T')}+09:00`;
}

/** 拡張子から image / video を推定する。 */
export function inferMediaKind(ref) {
  const ext = path.extname(new URL(ref, 'https://example.invalid/').pathname).toLowerCase();
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (VIDEO_EXT.includes(ext)) return 'video';
  return null;
}

export function isAbsoluteUrl(ref) {
  return /^https?:\/\//i.test(ref);
}

/** リポジトリ相対パスを GitHub Pages の公開 URL に変換する。 */
export function toPublicUrl(ref, baseUrl) {
  if (isAbsoluteUrl(ref)) return ref;
  const base = baseUrl.replace(/\/+$/, '');
  const rel = ref.replace(/^\.?\//, '');
  return `${base}/${rel.split('/').map(encodeURIComponent).join('/')}`;
}

export function loadPost(file, raw) {
  const { data, order, body } = parseFrontMatter(raw);
  const media = splitList(data.media);
  const platforms = splitList(data.platforms).map((p) => p.toLowerCase());
  const kinds = new Set(media.map(inferMediaKind));

  return {
    file,
    data,
    order,
    body: body.trim(),
    platforms,
    media,
    mediaKind: kinds.size === 1 ? [...kinds][0] : kinds.size === 0 ? null : 'mixed',
    alt: data.alt || '',
    link: data.link || '',
    status: data.status || 'scheduled',
    attempts: Number(data.attempts || 0),
    publishAt: parsePublishAt(data.publish_at),
    postedIds: {
      threads: data.posted_threads || '',
      instagram: data.posted_instagram || '',
    },
  };
}

export async function listPostFiles(dir = POSTS_DIR) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('_') && e.name !== 'README.md')
    .map((e) => path.join(dir, e.name))
    .sort();
}

export async function loadQueue(dir = POSTS_DIR) {
  const files = await listPostFiles(dir);
  const posts = [];
  const errors = [];
  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    try {
      posts.push(loadPost(file, raw));
    } catch (err) {
      errors.push({ file, message: err.message });
    }
  }
  posts.sort((a, b) => a.publishAt - b.publishAt);
  return { posts, errors };
}

/** 前付けを更新してファイルに書き戻す。値が null のキーは削除する。 */
export async function updateFrontMatter(post, patch) {
  const raw = await readFile(post.file, 'utf8');
  const parsed = parseFrontMatter(raw);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete parsed.data[key];
    } else {
      parsed.data[key] = String(value);
      if (!parsed.order.includes(key)) parsed.order.push(key);
    }
  }
  await writeFile(post.file, serializeFrontMatter(parsed), 'utf8');
  Object.assign(post.data, patch);
}
