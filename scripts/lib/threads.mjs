// Threads API クライアント。
// 公式ドキュメント: https://developers.facebook.com/docs/threads
//
// 投稿は 2 段階。
//   1) メディアコンテナを作る   POST /{user-id}/threads
//   2) コンテナを公開する       POST /{user-id}/threads_publish

import { getJson, postForm, sleep } from './http.mjs';
import { log } from './log.mjs';

export const THREADS_TEXT_LIMIT = 500;

export class ThreadsClient {
  constructor({ userId, accessToken, base, version }) {
    this.userId = userId;
    this.accessToken = accessToken;
    this.base = (base || 'https://graph.threads.net').replace(/\/+$/, '');
    this.version = version || 'v1.0';
  }

  url(pathname) {
    return `${this.base}/${this.version}/${pathname}`;
  }

  async createContainer(params) {
    const body = await postForm(this.url(`${this.userId}/threads`), {
      access_token: this.accessToken,
      ...params,
    }, { label: 'threads:create-container' });
    if (!body.id) throw new Error(`Threads: コンテナ ID が返りませんでした: ${JSON.stringify(body)}`);
    return body.id;
  }

  async getContainerStatus(id) {
    return getJson(this.url(id), {
      access_token: this.accessToken,
      fields: 'status,error_message',
    }, { label: 'threads:container-status' });
  }

  /** コンテナが FINISHED になるまで待つ。動画・カルーセルで必要。 */
  async waitUntilReady(id, { timeoutMs = 5 * 60 * 1000, intervalMs = 10_000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const { status, error_message: errorMessage } = await this.getContainerStatus(id);
      if (status === 'FINISHED' || status === 'PUBLISHED') return;
      if (status === 'ERROR' || status === 'EXPIRED') {
        throw new Error(`Threads: コンテナ ${id} が ${status} になりました: ${errorMessage || '(詳細なし)'}`);
      }
      if (Date.now() >= deadline) {
        throw new Error(`Threads: コンテナ ${id} が時間内に処理されませんでした（最終 status=${status}）`);
      }
      log.step(`Threads: コンテナ ${id} を処理中（status=${status}）…`);
      await sleep(intervalMs);
    }
  }

  async publish(creationId) {
    const body = await postForm(this.url(`${this.userId}/threads_publish`), {
      access_token: this.accessToken,
      creation_id: creationId,
    }, { label: 'threads:publish' });
    if (!body.id) throw new Error(`Threads: 投稿 ID が返りませんでした: ${JSON.stringify(body)}`);
    return body.id;
  }

  async permalink(postId) {
    try {
      const body = await getJson(this.url(postId), {
        access_token: this.accessToken,
        fields: 'permalink',
      }, { label: 'threads:permalink', attempts: 1 });
      return body.permalink || '';
    } catch {
      return '';
    }
  }

  /**
   * 1 件の投稿を公開する。
   * @param {{text:string, mediaUrls:string[], mediaKind:'image'|'video'|null, alt?:string, link?:string, replyToId?:string}} post
   */
  async post({ text, mediaUrls = [], mediaKind = null, alt = '', link = '', replyToId = '' }) {
    let creationId;

    if (mediaUrls.length === 0) {
      creationId = await this.createContainer({
        media_type: 'TEXT',
        text,
        link_attachment: link,
        reply_to_id: replyToId,
      });
    } else if (mediaUrls.length === 1) {
      const isVideo = mediaKind === 'video';
      creationId = await this.createContainer({
        media_type: isVideo ? 'VIDEO' : 'IMAGE',
        text,
        [isVideo ? 'video_url' : 'image_url']: mediaUrls[0],
        alt_text: alt,
        reply_to_id: replyToId,
      });
      if (isVideo) await this.waitUntilReady(creationId);
    } else {
      const children = [];
      for (const url of mediaUrls) {
        const isVideo = /\.(mp4|mov)(\?|$)/i.test(url);
        const childId = await this.createContainer({
          media_type: isVideo ? 'VIDEO' : 'IMAGE',
          [isVideo ? 'video_url' : 'image_url']: url,
          alt_text: alt,
          is_carousel_item: 'true',
        });
        children.push(childId);
      }
      for (const childId of children) await this.waitUntilReady(childId);
      creationId = await this.createContainer({
        media_type: 'CAROUSEL',
        text,
        children: children.join(','),
        reply_to_id: replyToId,
      });
      await this.waitUntilReady(creationId);
    }

    // 公式ドキュメントの推奨どおり、公開前に少し待つ。
    await sleep(Number(process.env.THREADS_PUBLISH_DELAY_MS || 30_000));

    const postId = await this.publish(creationId);
    return { id: postId, permalink: await this.permalink(postId) };
  }
}

/** 「me」からユーザー ID を引く（初期セットアップ用）。 */
export async function fetchThreadsUser({ accessToken, base, version }) {
  const host = (base || 'https://graph.threads.net').replace(/\/+$/, '');
  return getJson(`${host}/${version || 'v1.0'}/me`, {
    access_token: accessToken,
    fields: 'id,username',
  }, { label: 'threads:me' });
}
