import { test } from "node:test";
import assert from "node:assert/strict";
import { ANALYTICS_API, PRODUCTION_HOST, trackUsage, type UsageEnv } from "./usage.ts";

function env(over: Partial<UsageEnv> = {}) {
  const sent: { url: string; body: unknown }[] = [];
  const e: UsageEnv = {
    host: PRODUCTION_HOST, doNotTrack: null, optedOut: () => false, newId: () => "id-1",
    send: (url, body) => sent.push({ url, body: JSON.parse(body) }), ...over,
  };
  return { e, sent };
}

test("usage: 正式域名发送固定 payload，只含格式枚举", () => {
  const { e, sent } = env();
  trackUsage({ event: "editor.open" }, e);
  trackUsage({ event: "page.view" }, e);
  trackUsage({ event: "score.export", format: "midi" }, e);
  assert.deepEqual(sent, [
    { url: `${ANALYTICS_API}/events`, body: { project: "jianpu-editor", event_id: "id-1", event: "editor.open", properties: {} } },
    { url: `${ANALYTICS_API}/events`, body: { project: "jianpu-editor", event_id: "id-1", event: "page.view", properties: {} } },
    { url: `${ANALYTICS_API}/events`, body: { project: "jianpu-editor", event_id: "id-1", event: "score.export", properties: { format: "midi" } } },
  ]);
});

test("usage: DNT、用户关闭、非正式域名都不发送", () => {
  for (const over of [{ doNotTrack: "1" }, { optedOut: () => true }, { host: "localhost" }, { host: "jianpu-editor.pages.dev" }]) {
    const { e, sent } = env(over);
    trackUsage({ event: "editor.open" }, e);
    trackUsage({ event: "page.view" }, e);
    assert.equal(sent.length, 0);
  }
});

test("usage: 发送异常不抛出", () => {
  const { e } = env({ send: () => { throw new Error("offline"); } });
  assert.doesNotThrow(() => trackUsage({ event: "editor.open" }, e));
});
