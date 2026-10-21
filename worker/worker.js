/**
 * Dhoondh search backend — a single-file Cloudflare Worker.
 *
 * Self-contained on purpose: you can paste this whole file into the Cloudflare
 * dashboard's Worker editor (no build step, no subfolders), or deploy it with
 * `wrangler deploy`.
 *
 * A static web page can't fetch Google / DuckDuckGo / Brave results directly
 * (CORS + bot-blocking). This Worker does it server-side and returns clean JSON
 * with CORS enabled, so the Dhoondh page can show real web results in-page.
 *
 * Upstreams, in order of preference:
 *   1. Brave Search API  — set BRAVE_API_KEY   (most reliable, free tier)
 *   2. SearXNG instance  — set SEARXNG_URL     (self-hosted meta-search)
 *   3. DuckDuckGo HTML   — default, no key     (tries html + lite + Instant Answer)
 *
 * Debug: append ?debug=1 to see per-attempt details.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

const FORM_HEADERS = {
  "content-type": "application/x-www-form-urlencoded",
  "user-agent": UA,
  "accept-language": "en-US,en;q=0.9"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);

    // Notion ingest: POST /notion { events: [...] } — writes straight into the
    // "Dhoondh Diagnostics — Events" database. Needs NOTION_TOKEN + NOTION_DB_ID.
    if (url.pathname.replace(/\/+$/, "").endsWith("/notion")) return await notionSync(request, env);

    const q = (url.searchParams.get("q") || "").trim();
    const debug = url.searchParams.get("debug") === "1";
    if (!q) return json({ error: "missing ?q= parameter", results: [] }, 400);

    try {
      let data;
      if (env && env.BRAVE_API_KEY) data = await brave(q, env.BRAVE_API_KEY);
      else if (env && env.SEARXNG_URL) data = await searxng(q, env.SEARXNG_URL);
      else data = await keyless(q);
      if (!debug && data.debug) delete data.debug;
      return json(data, 200);
    } catch (err) {
      return json({ error: String((err && err.message) || err), results: [] }, 502);
    }
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      ...CORS
    }
  });
}

/* ---------- Notion diagnostics ingest ----------
   POST /notion  { "events": [ ... ] }
   Worker env: NOTION_TOKEN (integration secret) + NOTION_DB_ID (database id).
   The token stays in the Worker — the browser never sees it.
*/
const NOTION_VERSION = "2022-06-28";
const MAX_PER_REQUEST = 40;

async function notionSync(request, env) {
  if (request.method !== "POST")
    return json({ error: "use_post", message: "POST a JSON body: { events: [...] }" }, 405);
  if (!env || !env.NOTION_TOKEN || !env.NOTION_DB_ID)
    return json({
      error: "notion_not_configured",
      message: "Set Worker secret NOTION_TOKEN and variable NOTION_DB_ID (Cloudflare -> Settings -> Variables).",
      received: 0
    }, 501);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_json" }, 400); }
  const events = Array.isArray(body && body.events) ? body.events : [];
  if (!events.length) return json({ error: "no_events", received: 0 }, 400);
  const slice = events.slice(0, MAX_PER_REQUEST);

  let created = 0, failed = 0;
  const errors = [];
  for (const ev of slice) {
    try {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          authorization: "Bearer " + env.NOTION_TOKEN,
          "notion-version": NOTION_VERSION,
          "content-type": "application/json"
        },
        body: JSON.stringify({ parent: { database_id: env.NOTION_DB_ID }, properties: toNotionProps(ev) })
      });
      if (res.ok) created++;
      else {
        failed++;
        if (errors.length < 3) errors.push("HTTP " + res.status + " " + (await res.text()).slice(0, 180));
      }
    } catch (e) {
      failed++;
      if (errors.length < 3) errors.push(String((e && e.message) || e).slice(0, 180));
    }
    await new Promise((r) => setTimeout(r, 350)); // Notion allows ~3 requests/sec
  }
  return json({
    ok: failed === 0, received: events.length, sent: slice.length, created, failed,
    truncated: events.length > slice.length, errors
  }, 200);
}

function rt(s) {
  return { rich_text: s ? [{ text: { content: String(s).slice(0, 1900) } }] : [] };
}
function sel(s) {
  return s ? { select: { name: String(s) } } : { select: null };
}
function toNotionProps(ev) {
  ev = ev || {};
  const base = ["event_name", "schema_version", "timestamp", "session_id", "attempt_id", "user_id",
    "user_code", "platform", "app_version", "os", "device_model", "network_type", "screen_or_route",
    "log_level", "release_channel", "schema_valid", "validation_error"];
  const extra = {};
  for (const k in ev) { if (!base.includes(k)) extra[k] = ev[k]; }
  const stamp = String(ev.timestamp || "").slice(0, 16).replace("T", " ");
  return {
    "Log": { title: [{ text: { content: ((ev.event_name || "event") + " \u00b7 " + (ev.user_code || "?") + " \u00b7 " + stamp).slice(0, 200) } }] },
    "User Code": rt(ev.user_code),
    "Event Name": sel(ev.event_name),
    "Level": sel(ev.log_level),
    "Session": rt(ev.session_id),
    "Attempt": rt(ev.attempt_id),
    "Route": rt(ev.screen_or_route),
    "Platform": sel(ev.platform),
    "OS": rt(ev.os),
    "Device": sel(ev.device_model),
    "Network": rt(ev.network_type),
    "Schema": rt(ev.schema_version),
    "App Version": rt(ev.app_version),
    "Release": sel(ev.release_channel),
    "Timestamp": ev.timestamp ? { date: { start: ev.timestamp } } : { date: null },
    "Details": rt(Object.keys(extra).length ? JSON.stringify(extra) : "")
  };
}

/* ---------- parsing helpers ---------- */

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch (e) { return s; }
}

function stripTags(s) {
  return String(s == null ? "" : s)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(Number(n)); })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function anchorsByClass(html, cls) {
  const out = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    if (new RegExp('class=["\'][^"\']*' + cls).test(m[1])) {
      const h = m[1].match(/href="([^"]+)"/);
      if (h) out.push({ href: h[1], text: m[2] });
    }
  }
  return out;
}

function cellsByClass(html, cls) {
  const out = [];
  const re = /<td\b([^>]*)>([\s\S]*?)<\/td>/g;
  let m;
  while ((m = re.exec(html))) {
    if (new RegExp('class=["\'][^"\']*' + cls).test(m[1])) out.push(m[2]);
  }
  return out;
}

function cleanHref(href) {
  let h = String(href).replace(/&amp;/g, "&");
  const u = h.match(/[?&]uddg=([^&]+)/);
  if (u) h = safeDecode(u[1]);
  if (h.indexOf("//") === 0) h = "https:" + h;
  return h;
}

function parseDDG(html) {
  const out = [];
  const links = anchorsByClass(html, "result__a");
  const snips = anchorsByClass(html, "result__snippet");
  links.forEach((l, i) => {
    const url = cleanHref(l.href);
    const title = stripTags(l.text);
    const snippet = snips[i] ? stripTags(snips[i].text) : "";
    if (title && /^https?:/i.test(url)) out.push({ title, url, snippet });
  });
  return out;
}

function parseLite(html) {
  const out = [];
  const links = anchorsByClass(html, "result-link");
  const snips = cellsByClass(html, "result-snippet");
  links.forEach((l, i) => {
    const url = cleanHref(l.href);
    const title = stripTags(l.text);
    const snippet = snips[i] ? stripTags(snips[i]) : "";
    if (title && /^https?:/i.test(url)) out.push({ title, url, snippet });
  });
  return out;
}

/* Bing markup — the real URL is base64url-encoded in the ?u=a1... redirect param */
function decodeBingUrl(href) {
  const h = String(href).replace(/&amp;/g, "&");
  const m = h.match(/[?&]u=a1([^&]+)/);
  if (m) {
    let b = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    try { return atob(b); } catch (e) { /* fall through */ }
  }
  return h;
}

function parseBing(html) {
  const out = [];
  const reA = /<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const reS = /<p class="b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
  const links = [...html.matchAll(reA)];
  const snips = [...html.matchAll(reS)];
  links.forEach((m, i) => {
    const url = decodeBingUrl(m[1]);
    const title = stripTags(m[2]);
    const snippet = snips[i] ? stripTags(snips[i][1]) : "";
    if (title && /^https?:/i.test(url)) out.push({ title, url, snippet });
  });
  return out;
}

/* ---------- DuckDuckGo (no key) ---------- */

async function keyless(q) {
  const debug = [];

  // 1. Bing — usually reachable from datacenter IPs, no key.
  try {
    const r = await bing(q);
    debug.push("bing -> " + r.length);
    if (r.length) return { source: "bing", results: r, debug };
  } catch (e) {
    debug.push("bing err " + (e && e.message));
  }

  // 2. DuckDuckGo html / lite.
  const enc = encodeURIComponent(q);
  const attempts = [
    ["html-post", "https://html.duckduckgo.com/html/",
      { method: "POST", headers: FORM_HEADERS, body: "q=" + enc + "&b=" }],
    ["html-get", "https://html.duckduckgo.com/html/?q=" + enc,
      { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" } }],
    ["lite-post", "https://lite.duckduckgo.com/lite/",
      { method: "POST", headers: FORM_HEADERS, body: "q=" + enc }]
  ];
  for (const [name, url, init] of attempts) {
    try {
      const res = await fetch(url, init);
      const html = await res.text();
      if (/anomaly-modal|anomaly-modal__puzzle/.test(html)) {
        debug.push(name + " " + res.status + " blocked");
        continue;
      }
      let results = parseDDG(html);
      if (!results.length) results = parseLite(html);
      debug.push(name + " " + res.status + " " + html.length + "b -> " + results.length);
      if (results.length) return { source: "duckduckgo", results, debug };
    } catch (e) {
      debug.push(name + " err " + (e && e.message));
    }
  }
  // last resort: DuckDuckGo Instant Answer API (works server-side, no key)
  try {
    const instant = await ddgInstant(q);
    debug.push("instant -> " + instant.length);
    if (instant.length) return { source: "duckduckgo-instant", results: instant, debug };
  } catch (e) {
    debug.push("instant err " + (e && e.message));
  }
  return { source: "none", blocked: true, results: [], debug };
}

async function bing(q) {
  const res = await fetch(
    "https://www.bing.com/search?q=" + encodeURIComponent(q) + "&count=20",
    { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" } }
  );
  const html = await res.text();
  return parseBing(html);
}

async function ddgInstant(q) {
  const res = await fetch(
    "https://api.duckduckgo.com/?q=" + encodeURIComponent(q) +
    "&format=json&no_html=1&skip_disambig=1&no_redirect=1",
    { headers: { "user-agent": UA } }
  );
  const data = await res.json();
  const out = [];
  if (data.AbstractText && data.AbstractURL) {
    out.push({ title: data.Heading || q, url: data.AbstractURL, snippet: data.AbstractText });
  }
  const topics = [];
  (data.RelatedTopics || []).forEach((t) => { if (t.Topics) topics.push(...t.Topics); else topics.push(t); });
  topics.forEach((t) => {
    if (t.FirstURL && t.Text) {
      const parts = t.Text.split(" - ");
      out.push({ title: parts[0], url: t.FirstURL, snippet: parts.slice(1).join(" - ") });
    }
  });
  return out.slice(0, 12);
}

/* ---------- SearXNG (self-hosted meta-search) ---------- */

async function searxng(q, base) {
  const url = base.replace(/\/+$/, "") + "/search?q=" + encodeURIComponent(q) + "&format=json";
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  const data = await res.json();
  const results = (data.results || []).slice(0, 12).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content || ""
  }));
  return { source: "searxng", results };
}

/* ---------- Brave Search API ---------- */

async function brave(q, key) {
  const url = "https://api.search.brave.com/res/v1/web/search?count=12&q=" + encodeURIComponent(q);
  const res = await fetch(url, {
    headers: { accept: "application/json", "x-subscription-token": key }
  });
  const data = await res.json();
  const results = (((data || {}).web || {}).results || []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: String(r.description || "").replace(/<[^>]*>/g, "").trim()
  }));
  return { source: "brave", results };
}
