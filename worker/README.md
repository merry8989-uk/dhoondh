# Dhoondh search backend (Cloudflare Worker)

This tiny Worker is what turns Dhoondh from a "launcher" into a **real search
engine that shows web results in-page**.

A static web page can't fetch Google / DuckDuckGo / Brave directly — browsers
block it (CORS) and the engines block bots. This Worker does the request
server-side and returns clean JSON with CORS enabled. The Dhoondh page then
renders the results itself.

Upstreams, in order of preference:

| Set this | Uses | Notes |
|----------|------|-------|
| `BRAVE_API_KEY` | Brave Search API | Most reliable. Free tier (~2,000 queries/month). |
| `SEARXNG_URL` | Your SearXNG instance | Self-hosted meta-search (aggregates Google, DDG, Brave…). |
| *(nothing)* | DuckDuckGo HTML | Zero setup, no key. DDG may occasionally show a bot-check. |

## Deploy — one click

1. Click: **https://deploy.workers.cloudflare.com/?url=https://github.com/merry8989-uk/dhoondh/tree/main/worker**
2. Sign in / create a free Cloudflare account.
3. Deploy. You'll get a URL like `https://dhoondh-search.<you>.workers.dev`.
4. Open the Dhoondh site, scroll to the footer, paste that URL into
   **"Web results backend"** and hit **Save**.
5. Search anything — real web results now appear in the page.

## Deploy — with Wrangler (command line)

```bash
npm install -g wrangler
wrangler login
cd worker
wrangler deploy
```

## Optional: better results

- **Brave API key** (recommended): get one at
  <https://brave.com/search/api/> then
  `wrangler secret put BRAVE_API_KEY` (or add it in the dashboard).
- **SearXNG**: self-host (or use an instance that allows the JSON API) and set
  `SEARXNG_URL`.

## Test it

```
https://dhoondh-search.<you>.workers.dev/?q=ISRO
```

You should get JSON like:

```json
{ "source": "duckduckgo", "results": [ { "title": "…", "url": "…", "snippet": "…" } ] }
```

If `"blocked": true` comes back, DuckDuckGo showed a bot-check — set
`BRAVE_API_KEY` or `SEARXNG_URL`.

## Note on terms

Scraping DuckDuckGo's HTML is fine for light personal use but is a grey area and
can be rate-limited. For anything serious, use the Brave API or a self-hosted
SearXNG. Dhoondh only ever calls *your* Worker.
