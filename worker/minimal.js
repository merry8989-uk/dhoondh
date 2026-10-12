/**
 * Dhoondh — minimal search worker (Bing, no key, no card).
 * Paste this whole file into Cloudflare's Worker editor and click Deploy.
 * Test:  https://<your-worker>/?q=ISRO
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
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const q = new URL(request.url).searchParams.get("q") || "";
    if (!q) return out({ error: "missing ?q= parameter", results: [] }, 400);
    try {
      const res = await fetch(
        "https://www.bing.com/search" + encodeURIComponent(q) + "&count=20",
        { headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" } }
      );
      const html = await res.text();
      return out({ source: "bing", results: parse(html) }, 200);
    } catch (e) {
      return out({ error: String((e && e.message) || e), results: [] }, 502);
    }
  }
};

function out(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS }
  });
}

function strip(s) {
  return String(s == null ? "" : s)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(+n); })
    .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function realUrl(href) {
  const h = String(href).replace(/&amp;/g, "&");
  const m = h.match(/[?&]u=a1([^&]+)/);
  if (m) {
    let b = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b.length % 4) b += "=";
    try { return atob(b); } catch (e) { /* ignore */ }
  }
  return h;
}

function parse(html) {
  const A = [...html.matchAll(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const S = [...html.matchAll(/<p class="b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/g)];
  const r = [];
  A.forEach(function (m, i) {
    const u = realUrl(m[1]);
    const t = strip(m[2]);
    if (t && /^https?:/i.test(u)) {
      r.push({ title: t, url: u, snippet: S[i] ? strip(S[i][1]) : "" });
    }
  });
  return r;
}
