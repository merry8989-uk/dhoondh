/**
 * Dhoondh search backend — a tiny Cloudflare Worker.
 *
 * A static web page can't fetch Google / DuckDuckGo / Brave results directly
 * (CORS + bot-blocking). This Worker does it server-side and returns clean JSON
 * with CORS enabled, so the Dhoondh page can show real web results in-page.
 *
 * Upstreams, in order of preference:
 *   1. Brave Search API  — set BRAVE_API_KEY      (most reliable, free tier)
 *   2. SearXNG instance  — set SEARXNG_URL        (self-hosted meta-search)
 *   3. DuckDuckGo HTML   — default, no key        (may occasionally hit a bot-check)
 *
 * Deploy in ~2 minutes — see README.md in this folder.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const q = (new URL(request.url).searchParams.get("q") || "").trim();
    if (!q) return json({ error: "missing ?q= parameter", results: [] }, 400);

    try {
      let data;
      if (env && env.BRAVE_API_KEY) data = await brave(q, env.BRAVE_API_KEY);
      else if (env && env.SEARXNG_URL) data = await searxng(q, env.SEARXNG_URL);
      else data = await ddg(q);
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

/* ---------- DuckDuckGo HTML (no key) ---------- */

async function ddg(q) {
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": UA,
      "accept-language": "en-US,en;q=0.9"
    },
    body: "q=" + encodeURIComponent(q) + "&b="
  });
  const html = await res.text();
  if (/anomaly-modal|anomaly-modal__puzzle/.test(html)) {
    return { source: "duckduckgo", blocked: true, results: [] };
  }
  return { source: "duckduckgo", results: parseDDG(html) };
}

function parseDDG(html) {
  const out = [];
  const reA = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const reS = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  const links = [...html.matchAll(reA)];
  const snips = [...html.matchAll(reS)];
  links.forEach((m, i) => {
    let href = m[1].replace(/&amp;/g, "&");
    const u = href.match(/[?&]uddg=([^&]+)/);
    if (u) href = safeDecode(u[1]);
    if (href.indexOf("//") === 0) href = "https:" + href;
    const title = stripTags(m[2]);
    const snippet = snips[i] ? stripTags(snips[i][1]) : "";
    if (title && /^https?:/i.test(href)) out.push({ title, url: href, snippet });
  });
  return out;
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
    snippet: stripTags(r.description || "")
  }));
  return { source: "brave", results };
}
