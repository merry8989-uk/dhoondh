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
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const q = (url.searchParams.get("q") || "").trim();
    const debug = url.searchParams.get("debug") === "1";
    if (!q) return json({ error: "missing ?q= parameter", results: [] }, 400);

    try {
      let data;
      if (env && env.BRAVE_API_KEY) data = await brave(q, env.BRAVE_API_KEY);
      else if (env && env.SEARXNG_URL) data = await searxng(q, env.SEARXNG_URL);
      else data = await ddg(q);
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

/* ---------- parsing helpers ---------- */

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch (e) { return s; }
}

function stripTags(s) {
  return String(s == null ? "" : s)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
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

/* ---------- DuckDuckGo (no key) ---------- */

async function ddg(q) {
  const enc = encodeURIComponent(q);
  const attempts = [
    ["html-post", "https://html.duckduckgo.com/html/",
      { method: "POST", headers: FORM_HEADERS, body: "q=" + enc + "&b=" }],
    ["html-get", "https://html.duckduckgo.com/html/?q=" + enc,
      { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" } }],
    ["lite-post", "https://lite.duckduckgo.com/lite/",
      { method: "POST", headers: FORM_HEADERS, body: "q=" + enc }]
  ];
  const debug = [];
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
  return { source: "duckduckgo", blocked: true, results: [], debug };
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
