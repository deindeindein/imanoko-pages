// 投稿ファイルの検証ルール。post.mjs と validate.mjs で共有する。

import { existsSync, statSync } from 'node:fs';
import { PLATFORMS, STATUSES, formatJst, isAbsoluteUrl, inferMediaKind } from './queue.mjs';
import { THREADS_TEXT_LIMIT } from './threads.mjs';
import { IG_CAPTION_LIMIT, IG_HASHTAG_LIMIT, IG_CAROUSEL_MIN, IG_CAROUSEL_MAX } from './instagram.mjs';

const THREADS_CAROUSEL_MAX = 20;
// GitHub の 1 ファイル推奨上限。これを超えると push 時に警告・拒否される。
const MAX_MEDIA_BYTES = 100 * 1024 * 1024;

export function countChars(text) {
  return [...text].length;
}

export function countHashtags(text) {
  const matches = text.match(/(^|\s)#[^\s#]+/gu);
  return matches ? matches.length : 0;
}

/**
 * 1 件を検証して { errors, warnings } を返す。
 * errors があるものは投稿しない。
 */
export function validatePost(post) {
  const errors = [];
  const warnings = [];
  const text = post.body;

  if (!STATUSES.includes(post.status)) {
    errors.push(`status: ${post.status} は不正です（${STATUSES.join(' / ')} のいずれか）`);
  }

  if (post.platforms.length === 0) {
    errors.push('platforms: 投稿先が指定されていません（threads / instagram）');
  }
  for (const p of post.platforms) {
    if (!PLATFORMS.includes(p)) errors.push(`platforms: ${p} は不明な投稿先です`);
  }
  if (new Set(post.platforms).size !== post.platforms.length) {
    warnings.push('platforms: 同じ投稿先が重複しています');
  }

  if (text.length === 0) {
    errors.push('本文が空です（--- の下に投稿文を書いてください）');
  }

  // メディア
  for (const ref of post.media) {
    if (isAbsoluteUrl(ref)) {
      warnings.push(`media: ${ref} は外部 URL です。Meta 側から到達できることを確認してください`);
      continue;
    }
    if (!inferMediaKind(ref)) {
      errors.push(`media: ${ref} は対応していない拡張子です（.jpg / .jpeg / .png / .mp4 / .mov）`);
      continue;
    }
    if (!existsSync(ref)) {
      errors.push(`media: ${ref} がリポジトリに存在しません`);
      continue;
    }
    const size = statSync(ref).size;
    if (size > MAX_MEDIA_BYTES) {
      errors.push(`media: ${ref} が ${(size / 1024 / 1024).toFixed(1)}MB あります（100MB 未満にしてください）`);
    }
  }

  if (post.mediaKind === 'mixed' && post.media.length === 1) {
    errors.push('media: 種類を判定できませんでした');
  }

  if (post.media.length > 0 && post.mediaKind !== 'video' && !post.alt) {
    warnings.push('alt: 代替テキストが未設定です（読み上げ利用者のために推奨）');
  }

  // Threads
  if (post.platforms.includes('threads')) {
    if (countChars(text) > THREADS_TEXT_LIMIT) {
      errors.push(`Threads: 本文が ${countChars(text)} 文字あります（上限 ${THREADS_TEXT_LIMIT} 文字）`);
    }
    if (post.media.length > THREADS_CAROUSEL_MAX) {
      errors.push(`Threads: メディアが ${post.media.length} 件あります（上限 ${THREADS_CAROUSEL_MAX} 件）`);
    }
    if (post.link && post.media.length > 0) {
      warnings.push('link: リンク添付はテキストのみの投稿で有効です。メディア付きでは無視されます');
    }
  }

  // Instagram
  if (post.platforms.includes('instagram')) {
    if (post.media.length === 0) {
      errors.push('Instagram: メディアが必須です（media に画像か動画を指定してください）');
    }
    if (post.media.length > 1 && (post.media.length < IG_CAROUSEL_MIN || post.media.length > IG_CAROUSEL_MAX)) {
      errors.push(`Instagram: カルーセルは ${IG_CAROUSEL_MIN}〜${IG_CAROUSEL_MAX} 件です（現在 ${post.media.length} 件）`);
    }
    if (countChars(text) > IG_CAPTION_LIMIT) {
      errors.push(`Instagram: キャプションが ${countChars(text)} 文字あります（上限 ${IG_CAPTION_LIMIT} 文字）`);
    }
    const tags = countHashtags(text);
    if (tags > IG_HASHTAG_LIMIT) {
      errors.push(`Instagram: ハッシュタグが ${tags} 個あります（上限 ${IG_HASHTAG_LIMIT} 個）`);
    }
  }

  return { errors, warnings };
}

/** キュー全体を横断して見る検証（時刻の重なりなど）。 */
export function validateQueue(posts) {
  const warnings = [];
  const pending = posts.filter((p) => p.status === 'scheduled');
  for (let i = 1; i < pending.length; i++) {
    const prev = pending[i - 1];
    const cur = pending[i];
    const gapMin = (cur.publishAt - prev.publishAt) / 60000;
    if (gapMin < 30) {
      warnings.push(
        `${cur.file} は ${prev.file}（${formatJst(prev.publishAt)}）と ${Math.round(gapMin)} 分しか離れていません`,
      );
    }
  }
  return warnings;
}
