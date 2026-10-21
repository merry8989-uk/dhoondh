# Dhoondh search backend (Cloudflare Worker)

**One file, no build step.** `worker.js` is self-contained — you paste it into the
Cloudflare dashboard and deploy.

> **Easiest paste:** if the full file is awkward on a phone, use
> [`minimal.js`](minimal.js) instead — a 2 KB Bing-only worker with the same deploy
> steps. It returns real web results with no key and no card.

`worker.js` turns Dhoondh into a real search engine that shows web results in-page:
the Worker fetches results server-side (a static page can't — CORS + bot-blocking)
and returns clean JSON.

Upstreams, in order of preference:

| Set this | Uses | Notes |
|----------|------|-------|
| `BRAVE_API_KEY` | Brave Search API | Most reliable, but Brave now asks for a card on file. |
| `SEARXNG_URL` | Your SearXNG instance | Self-hosted meta-search (aggregates Google, DDG, Brave…). |
| *(nothing)* | **Bing**, then DuckDuckGo | Zero setup, **no key, no card**. Bing usually works from datacenter IPs; DuckDuckGo often shows a bot-check. |

## Deploy — easiest: paste into the dashboard (~2 min)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it `dhoondh-search` → **Deploy**.
3. Click **Edit code**. Select everything in the editor and delete it.
4. Copy the **whole** `worker.js` file from this repo and paste it in.
5. Click **Deploy** (top right).
6. Copy your Worker URL — like `https://dhoondh-search.<your-subdomain>.workers.dev`.
7. Open the Dhoondh site → scroll to the footer → **Web results backend** → paste the
   URL → **Save** → **Test**.

## Deploy — Git-connected (the "Set up your application" screen)

If you came in through the Deploy button and see a form, fill it like this:

- **Project name:** `dhoondh-search`
- **Build command:** leave empty
- **Deploy command:** `npx wrangler deploy`
- **Advanced settings → Root directory:** `worker`   ← **important**, the config lives there

Then **Deploy**.

## Deploy — Wrangler CLI

```bash
npm install -g wrangler
wrangler login
cd worker          # or run from the repo root (a root wrangler.toml is included)
wrangler deploy
```

## Optional: better, more reliable results

- **Brave API key (recommended):** get one at <https://brave.com/search/api/>, then add
  `BRAVE_API_KEY` as a **secret** in the Worker's *Settings → Variables and Secrets*.
- **SearXNG:** set `SEARXNG_URL` instead.

## Test it

Open `https://<your-worker>/?q=ISRO`. You should get JSON:

```json
{ "source": "duckduckgo", "results": [ { "title": "…", "url": "…", "snippet": "…" } ] }
```

## Troubleshooting

- **`"blocked": true`** — DuckDuckGo showed its bot-check. This is common from datacenter
  IPs, **including Cloudflare's**. Fix: set `BRAVE_API_KEY` or `SEARXNG_URL`.
- **See exactly what happened:** `https://<your-worker>/?q=ISRO&debug=1` — the JSON then
  includes a `debug` array with every upstream attempt and why it failed.
- **In the app:** the footer's **Test** button shows the HTTP status, result count and
  source for your backend URL — use it first when something's off.
- **Worker URL works but the app says "JSON nahi mila"** — the Worker is probably still the
  default "Hello World" template. Paste `worker.js` and redeploy.

## Note on terms

Scraping DuckDuckGo's HTML is fine for light personal use but is a grey area and can be
rate-limited. For anything serious, use the Brave API or a self-hosted SearXNG. Dhoondh
only ever calls *your* Worker.

## Notion diagnostics sync (optional)

`worker.js` also exposes **`POST /notion`** — it takes `{ "events": [...] }` and writes each
event into a Notion database as a row. The Dhoondh app's Diagnostics panel has a
**Sync to Notion** button (and an **Auto-sync** checkbox) that calls it. The Notion token
lives only in the Worker, so the browser never sees it.

### One-time setup

1. **Create a Notion integration** — open <https://www.notion.so/my-integrations>, "New
   integration", name it, and copy the **Internal Integration Secret** (`ntn_...`).
2. **Share the database with it** — open the "Dhoondh Diagnostics — Events" database in
   Notion, `...` menu -> **Connections** -> add your integration. Without this the API
   returns 404 for every write.
3. **Set the Worker variables** — Cloudflare dashboard -> your Worker -> Settings ->
   Variables and Secrets:
   - `NOTION_TOKEN` — the integration secret (mark it **Secret** / encrypted)
   - `NOTION_DB_ID` — `f48646430c4f46fbadee0972a74fc2db`
4. **Deploy** `worker.js` again.
5. In the app: footer backend URL = your Worker URL -> Diagnostics -> **Sync to Notion**.

### What it returns

```json
{ "ok": true, "received": 12, "sent": 12, "created": 12, "failed": 0, "truncated": false, "errors": [] }
```

- Up to **40 events per request** (Notion allows ~3 requests/sec, so the Worker paces itself).
- If the token is missing it answers `501 { "error": "notion_not_configured" }` and the app
  shows a friendly hint instead of failing silently.
- Events are only marked synced after a successful response, so nothing is lost and nothing
  is duplicated.
