// Instagram コンテンツ公開 API クライアント。
// 公式ドキュメント: https://developers.facebook.com/docs/instagram-platform/content-publishing
//
// 既定は「Instagram ログイン」方式（graph.instagram.com）。
// Facebook ページ連携方式を使う場合は IG_API_BASE=https://graph.facebook.com に切り替える。
//
// 投稿は 2 段階。
//   1) メディアコンテナを作る   POST /{ig-user-id}/media
//   2) コンテナを公開する       POST /{ig-user-id}/media_publish

import { getJson, postForm, sleep } from './http.mjs';
import { log } from './log.mjs';

export const IG_CAPTION_LIMIT = 2200;
export const IG_HASHTAG_LIMIT = 30;
export const IG_CAROUSEL_MIN = 2;
export const IG_CAROUSEL_MAX = 10;

export class InstagramClient {
  constructor({ userId, accessToken, base, version }) {
    this.userId = userId;
    this.accessToken = accessToken;
    this.base = (base || 'https://graph.instagram.com').replace(/\/+$/, '');
    this.version = version || 'v23.0';
  }

  url(pathname) {
    return `${this.base}/${this.version}/${pathname}`;
  }

  async createContainer(params) {
    const body = await postForm(this.url(`${this.userId}/media`), {
      access_token: this.accessToken,
      ...params,
    }, { label: 'instagram:create-container' });
    if (!body.id) throw new Error(`Instagram: コンテナ ID が返りませんでした: ${JSON.stringify(body)}`);
    return body.id;
  }

  async getContainerStatus(id) {
    return getJson(this.url(id), {
      access_token: this.accessToken,
      fields: 'status_code,status',
    }, { label: 'instagram:container-status' });
  }

  /** コンテナが FINISHED になるまで待つ。動画（リール）では必須。 */
  async waitUntilReady(id, { timeoutMs = 10 * 60 * 1000, intervalMs = 15_000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const res = await this.getContainerStatus(id);
      const code = res.status_code;
      if (code === 'FINISHED' || code === 'PUBLISHED') return;
      if (code === 'ERROR' || code === 'EXPIRED') {
        throw new Error(`Instagram: コンテナ ${id} が ${code} になりました: ${res.status || '(詳細なし)'}`);
      }
      if (Date.now() >= deadline) {
        throw new Error(`Instagram: コンテナ ${id} が時間内に処理されませんでした（最終 status_code=${code}）`);
      }
      log.step(`Instagram: コンテナ ${id} を処理中（status_code=${code}）…`);
      await sleep(intervalMs);
    }
  }

  async publish(creationId) {
    const body = await postForm(this.url(`${this.userId}/media_publish`), {
      access_token: this.accessToken,
      creation_id: creationId,
    }, { label: 'instagram:publish' });
    if (!body.id) throw new Error(`Instagram: 投稿 ID が返りませんでした: ${JSON.stringify(body)}`);
    return body.id;
  }

  async permalink(mediaId) {
    try {
      const body = await getJson(this.url(mediaId), {
        access_token: this.accessToken,
        fields: 'permalink',
      }, { label: 'instagram:permalink', attempts: 1 });
      return body.permalink || '';
    } catch {
      return '';
    }
  }

  /** 直近 24 時間に API 経由で公開した件数（上限確認用）。取れなければ null。 */
  async publishingLimit() {
    try {
      const body = await getJson(this.url(`${this.userId}/content_publishing_limit`), {
        access_token: this.accessToken,
        fields: 'config,quota_usage',
      }, { label: 'instagram:publishing-limit', attempts: 1 });
      const row = body.data && body.data[0];
      if (!row) return null;
      return {
        used: row.quota_usage ?? null,
        total: row.config ? row.config.quota_total ?? null : null,
      };
    } catch {
      return null;
    }
  }

  /**
   * 1 件の投稿を公開する。
   * @param {{caption:string, mediaUrls:string[], mediaKind:'image'|'video', alt?:string}} post
   */
  async post({ caption, mediaUrls = [], mediaKind = 'image', alt = '' }) {
    if (mediaUrls.length === 0) {
      throw new Error('Instagram: メディアのない投稿はできません（media を指定してください）');
    }

    let creationId;

    if (mediaUrls.length === 1) {
      const isVideo = mediaKind === 'video';
      creationId = await this.createContainer(
        isVideo
          ? { media_type: 'REELS', video_url: mediaUrls[0], caption }
          : { image_url: mediaUrls[0], caption, alt_text: alt },
      );
      await this.waitUntilReady(creationId);
    } else {
      const children = [];
      for (const url of mediaUrls) {
        const isVideo = /\.(mp4|mov)(\?|$)/i.test(url);
        const childId = await this.createContainer(
          isVideo
            ? { media_type: 'VIDEO', video_url: url, is_carousel_item: 'true' }
            : { image_url: url, is_carousel_item: 'true', alt_text: alt },
        );
        children.push(childId);
      }
      for (const childId of children) await this.waitUntilReady(childId);
      creationId = await this.createContainer({
        media_type: 'CAROUSEL',
        caption,
        children: children.join(','),
      });
      await this.waitUntilReady(creationId);
    }

    const mediaId = await this.publish(creationId);
    return { id: mediaId, permalink: await this.permalink(mediaId) };
  }
}

/** 「me」からユーザー ID を引く（初期セットアップ用）。 */
export async function fetchInstagramUser({ accessToken, base, version }) {
  const host = (base || 'https://graph.instagram.com').replace(/\/+$/, '');
  return getJson(`${host}/${version || 'v23.0'}/me`, {
    access_token: accessToken,
    fields: 'id,username,account_type',
  }, { label: 'instagram:me' });
}
