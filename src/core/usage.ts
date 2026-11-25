/**
 * 匿名使用统计：只发固定事件名和导出格式枚举，不含标题、谱面、文件名、路径或任何用户标识。
 * 仅正式域名发送；浏览器开启 DNT 或用户在界面关闭后不发送。失败静默，不影响编辑。
 */
export const ANALYTICS_API = "https://api.webkubor.online/v1/analytics";
export const PRODUCTION_HOST = "jianpu.webkubor.online";
export const OPT_OUT_KEY = "jianpu-editor:analytics";

export type ExportFormat = "json" | "midi" | "wav" | "png" | "svg";
export type UsageEvent = { event: "editor.open" | "page.view" } | { event: "score.export"; format: ExportFormat };

export interface UsageEnv {
  host: string;
  doNotTrack: string | null;
  optedOut: () => boolean;
  send: (url: string, body: string) => void;
  newId: () => string;
}

export function usagePayload(e: UsageEvent, eventId: string) {
  return {
    project: "jianpu-editor",
    event_id: eventId,
    event: e.event,
    properties: e.event === "score.export" ? { format: e.format } : {},
  };
}

export function usageAllowed(env: Pick<UsageEnv, "host" | "doNotTrack" | "optedOut">): boolean {
  return env.host === PRODUCTION_HOST && env.doNotTrack !== "1" && !env.optedOut();
}

export function trackUsage(e: UsageEvent, env: UsageEnv = browserEnv()): void {
  try {
    if (!usageAllowed(env)) return;
    env.send(`${ANALYTICS_API}/events`, JSON.stringify(usagePayload(e, env.newId())));
  } catch { /* 统计永远不打断编辑 */ }
}

/** 持久关闭/开启（存本地） */
export function setUsageEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.removeItem(OPT_OUT_KEY);
    else localStorage.setItem(OPT_OUT_KEY, "off");
  } catch {}
}

export function usageEnabled(): boolean {
  try { return localStorage.getItem(OPT_OUT_KEY) !== "off"; } catch { return false; }
}

function browserEnv(): UsageEnv {
  return {
    host: location.hostname,
    doNotTrack: navigator.doNotTrack,
    optedOut: () => !usageEnabled(),
    newId: () => crypto.randomUUID(),
    send: (url, body) => {
      void fetch(url, {
        method: "POST", body, keepalive: true, credentials: "omit",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
    },
  };
}
