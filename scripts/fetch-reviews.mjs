#!/usr/bin/env node
// App Store の公開 RSS からレビューを取得し、data/ に保存して新着を Slack に流す。
//
//   node scripts/fetch-reviews.mjs
//
//   環境変数 SLACK_WEBHOOK_URL … Incoming Webhook の URL（未設定なら通知しない）
//   --no-slack        … 取得と保存だけ行う
//   --notify-first-run … 保存済みデータが無い初回でも Slack に流す

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(root, "reviews.config.json");
const JSON_PATH = path.join(root, "data", "reviews.json");
const JS_PATH = path.join(root, "data", "reviews.js");
const MAX_STORED = 2000;
const USER_AGENT = "imanoko-pages-review-fetcher/1.0";

const flags = new Set(process.argv.slice(2));
const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? "";

main().catch((error) => {
  console.error(`エラー: ${error.message}`);
  process.exit(1);
});

async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  const apps = Array.isArray(config.apps) ? config.apps : [];
  if (apps.length === 0) throw new Error("reviews.config.json に apps がありません");

  const previous = await readPrevious();
  const isFirstRun = previous.length === 0;
  const seen = new Map(previous.map((review) => [review.key, review]));

  const fetched = [];
  for (const app of apps) {
    const appId = await resolveAppId(app);
    const countries = app.countries?.length ? app.countries : ["jp"];
    for (const country of countries) {
      const reviews = await fetchApp(app, appId, country, config.pages ?? 3);
      console.log(`${app.name} (${country}): ${reviews.length} 件`);
      fetched.push(...reviews);
    }
  }

  const now = new Date().toISOString();
  const fresh = [];
  const merged = new Map(seen);
  for (const review of fetched) {
    const known = seen.get(review.key);
    if (known) {
      merged.set(review.key, { ...known, ...review, firstSeenAt: known.firstSeenAt });
    } else {
      const added = { ...review, firstSeenAt: now };
      merged.set(review.key, added);
      fresh.push(added);
    }
  }

  const reviews = [...merged.values()]
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
    .slice(0, MAX_STORED);

  await save({ generatedAt: now, reviews });
  console.log(`保存: ${reviews.length} 件（新着 ${fresh.length} 件）`);

  if (fresh.length === 0) return;
  if (flags.has("--no-slack") || !webhookUrl) {
    console.log("Slack へは送信しませんでした（--no-slack または SLACK_WEBHOOK_URL 未設定）");
    return;
  }
  if (isFirstRun && !flags.has("--notify-first-run")) {
    console.log("初回取得のため Slack への通知は省略しました");
    return;
  }
  await notifySlack(fresh, config.slack ?? {});
}

async function readPrevious() {
  try {
    const stored = JSON.parse(await readFile(JSON_PATH, "utf8"));
    return Array.isArray(stored.reviews) ? stored.reviews : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function save(payload) {
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  await mkdir(path.dirname(JSON_PATH), { recursive: true });
  await writeFile(JSON_PATH, json);
  // file:// でダッシュボードを開いても読めるように JS 版も書き出す。
  await writeFile(JS_PATH, `window.__REVIEWS__ = ${json.trimEnd()};\n`);
}

async function resolveAppId(app) {
  const appId = String(app.appId ?? "").trim();
  if (/^\d+$/.test(appId)) return appId;
  const bundleId = String(app.bundleId ?? "").trim();
  if (!bundleId) {
    throw new Error(`${app.name}: reviews.config.json の appId（数字の App Store ID）か bundleId を設定してください`);
  }
  const country = app.countries?.[0] ?? "jp";
  const url = `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=${country}`;
  const found = (await fetchJson(url))?.results?.[0]?.trackId;
  if (!found) throw new Error(`${app.name}: bundleId ${bundleId} から App Store ID を特定できませんでした`);
  console.log(`${app.name}: bundleId から appId ${found} を解決しました`);
  return String(found);
}

async function fetchApp(app, appId, country, pages) {
  const reviews = [];
  for (let page = 1; page <= pages; page += 1) {
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
    const feed = (await fetchJson(url))?.feed;
    const entries = toArray(feed?.entry).filter((entry) => entry?.["im:rating"]?.label);
    if (entries.length === 0) break;
    reviews.push(...entries.map((entry) => normalize(entry, app, appId, country)));
  }
  return reviews;
}

function normalize(entry, app, appId, country) {
  const id = entry.id?.label ?? entry.id?.attributes?.["im:id"] ?? "";
  return {
    key: `${appId}:${country}:${id}`,
    id,
    appId,
    appName: app.name,
    country,
    rating: Number(entry["im:rating"].label),
    version: entry["im:version"]?.label ?? "",
    author: entry.author?.name?.label ?? "",
    title: entry.title?.label ?? "",
    body: entry.content?.label ?? "",
    updatedAt: entry.updated?.label ?? null,
    url: linkOf(entry) ?? `https://apps.apple.com/${country}/app/id${appId}`,
  };
}

function linkOf(entry) {
  const link = toArray(entry.link).find((item) => item?.attributes?.href);
  return link?.attributes?.href ?? null;
}

function sortKey(review) {
  return review.updatedAt ?? review.firstSeenAt ?? "";
}

function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

async function fetchJson(url, attempt = 1) {
  try {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (attempt >= 4) throw new Error(`${url} の取得に失敗しました: ${error.message}`);
    await sleep(1000 * 2 ** (attempt - 1));
    return fetchJson(url, attempt + 1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function notifySlack(fresh, slackConfig) {
  const maxRating = Number(slackConfig.onlyRatingAtMost ?? 5);
  const target = fresh.filter((review) => review.rating <= maxRating);
  if (target.length === 0) return;

  const maxNotify = Number(slackConfig.maxNotify ?? 20);
  if (target.length > maxNotify) {
    await postSlack({ text: `新着レビュー ${target.length} 件（多いため一覧は省略しました）` });
    console.log(`Slack: ${target.length} 件をまとめて通知しました`);
    return;
  }

  for (const review of target) {
    await postSlack(slackMessage(review));
  }
  console.log(`Slack: ${target.length} 件を通知しました`);
}

function slackMessage(review) {
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const mark = review.rating <= 2 ? "🚨" : review.rating === 3 ? "⚠️" : "⭐";
  const meta = [review.appName, review.country.toUpperCase(), review.version && `v${review.version}`, review.author]
    .filter(Boolean)
    .join(" ・ ");
  const heading = `${mark} ${stars} ${review.title || "(タイトルなし)"}`;
  const body = truncate(review.body, 2000);
  const linkLabel = escapeSlack(heading).replace(/\|/g, "｜");
  return {
    text: `${heading}\n${meta}`,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `*<${review.url}|${linkLabel}>*\n${escapeSlack(meta)}` } },
      { type: "section", text: { type: "mrkdwn", text: escapeSlack(body) || "_本文なし_" } },
    ],
  };
}

function truncate(text, limit) {
  const value = String(text ?? "").trim();
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function escapeSlack(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function postSlack(payload) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Slack への送信に失敗しました: HTTP ${response.status} ${await response.text()}`);
  }
}
