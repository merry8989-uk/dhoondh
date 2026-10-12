# Dhoondh — apna search engine

A small, dependency-free search engine you can **add to your browser** or
**install as an app**. Type a query and it shows real results plus one-click
hand-off to the engines that do the rest.

Live site: **https://merry8989-uk.github.io/dhoondh/**

## Tabs

| Tab | What it shows |
|-----|----------------|
| **All** | Wikipedia answer + articles, and 8 general engines (Google, DuckDuckGo, Bing, Brave, YouTube, Images, News, Maps) |
| **AI** | Sarvam **Indus AI** (highlighted) + ChatGPT, Perplexity, Gemini, Claude, Copilot, Grok, DeepSeek, You.com |
| **Images** | Real image grid from Wikimedia Commons + Google/Bing Images, Unsplash, Pexels, Openverse |
| **Videos** | Real videos from the Internet Archive + YouTube, Google Videos, Vimeo, Dailymotion |
| **YouTube** | YouTube, YouTube Music, Shorts, latest uploads |
| **Papers** | Real texts from the Internet Archive + Google Scholar, arXiv, Semantic Scholar, OpenAlex, CORE, PubMed, ResearchGate, SSRN |
| **Books / EPUB** | Real books (EPUB/PDF) from the Internet Archive + Project Gutenberg, Open Library, Standard Ebooks, Google Books |
| **PDF** | Real PDFs from the Internet Archive + `filetype:pdf` searches on Google/Bing/Scholar |
| **PPT** | `filetype:ppt/pptx` searches + SlideShare + Internet Archive |
| **Drive** | Public Google Drive files/folders via `site:drive.google.com` (docs, sheets, pdf, video, audio) |
| **Terabox** | `site:terabox.com` / `site:teraboxapp.com` / `site:1024tera.com` searches |
| **Archive** | Everything on the Internet Archive (texts, movies, audio) + Wayback Machine |

## Install it as an app (PWA)

The site is a Progressive Web App, so you can install it like a native app — no
store, no APK needed:

- **Android (Chrome):** open the site → menu → **Add to Home screen** / **Install app**
  (an "Install app" button also appears in the header when available).
- **Desktop (Chrome/Edge):** the install icon in the address bar.
- **iPhone (Safari):** Share → **Add to Home Screen**.

It then opens in its own window with the Dhoondh icon, and the shell works offline.

## Android APK

Two ways to get an actual `.apk`:

1. **No code — PWABuilder.** Go to <https://www.pwabuilder.com/>, enter the live
   URL, and download a signed Android package. See `android/README.md`.
2. **Build it yourself.** The `android/` folder is a minimal WebView wrapper
   project — open it in Android Studio and Build → Build APK(s).
   Full steps in `android/README.md`.

## Files

- `index.html` — the search page (the engine itself)
- `manifest.webmanifest` — PWA manifest (name, icons, shortcuts)
- `sw.js` — service worker (offline shell + installability)
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` — app icons
- `favicon.svg` — browser icon
- `opensearch.xml` — lets the browser add it as a search engine
- `worker/` — optional Cloudflare Worker that fetches real web results in-page
- `android/` — Android WebView wrapper project (for building an APK)
- `SETUP.md` — how to add it to Chrome/Firefox, and the APK steps

## Data sources

Results are pulled live in the browser from free, CORS-enabled public APIs:

- Wikipedia (search + summaries) — CC BY-SA
- Internet Archive (advanced search) — for texts, books, papers, PDFs, videos, audio
- Wikimedia Commons (File namespace) — for images

Everything else opens in a new tab on the target site.

No server, no build step, no API key. Open `index.html` and it works.

## Add it to your browser

See `SETUP.md`. Quick version (Chrome/Edge): Settings → Search engines → Add →
URL `https://merry8989-uk.github.io/dhoondh/?q=%s`, shortcut `dh`.

## Real web results (optional backend)

Dhoondh shows web results **in the page**, like a normal search engine. For that it uses a
tiny server-side proxy — a free Cloudflare Worker in [`worker/`](worker/) — because a
static page can't fetch Google / DuckDuckGo / Brave directly (CORS + bot-blocking).

- **Without the backend:** the All tab shows a setup card and one-click hand-off buttons
  (Google, DuckDuckGo, Bing, Brave…), while Wikipedia / Internet Archive / Commons results
  still render in-page.
- **With the backend:** the All tab renders real web results (DuckDuckGo by default) right
  in the page.

Deploy it in ~2 minutes (one click) and paste the URL into the **"Web results backend"**
field in the footer. Full steps: [`worker/README.md`](worker/README.md). The Worker can use
the Brave Search API (key), a SearXNG instance, or DuckDuckGo HTML (no key).

## Contact / Feedback

Suggestion, feedback ya naya feature chahiye? Instagram par
[@osintgram_io](https://instagram.com/osintgram_io) par message karo — the app has a
**Feedback** button in the header and a contact line in the footer that go there.

## License

MIT — do what you like.
