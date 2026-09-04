#!/usr/bin/env node
// 投稿キューの検証。CI と手元の両方で使う。
//   npm run validate

import { loadQueue, formatJst } from './lib/queue.mjs';
import { validatePost, validateQueue } from './lib/validate.mjs';
import { log } from './lib/log.mjs';

const { posts, errors: parseErrors } = await loadQueue();

let errorCount = 0;
let warnCount = 0;

for (const { file, message } of parseErrors) {
  log.error(`${file}: ${message}`);
  errorCount++;
}

for (const post of posts) {
  const { errors, warnings } = validatePost(post);
  const label = `${post.file} [${post.status}] ${formatJst(post.publishAt)} → ${post.platforms.join(', ') || '(未指定)'}`;
  if (errors.length === 0 && warnings.length === 0) {
    log.ok(label);
  } else {
    log.info(label);
    for (const e of errors) log.error(`  ${e}`);
    for (const w of warnings) log.warn(`  ${w}`);
  }
  errorCount += errors.length;
  warnCount += warnings.length;
}

for (const w of validateQueue(posts)) {
  log.warn(w);
  warnCount++;
}

log.info(`検証完了: ${posts.length} 件 / エラー ${errorCount} 件 / 警告 ${warnCount} 件`);
process.exit(errorCount > 0 ? 1 : 0);
