# Dhoondh — apna search engine (setup)

Ek simple multi-tab search engine jo aap apne browser me add kar sakte ho **ya app
ki tarah install** kar sakte ho. Iski apni public website bhi hai:

**https://merry8989-uk.github.io/dhoondh/**

## Files

- `index.html` — search page (yahi aapka engine hai)
- `manifest.webmanifest` — PWA manifest (app naam, icons, shortcuts)
- `sw.js` — service worker (offline + installable)
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` — app icons
- `favicon.svg` — browser icon
- `opensearch.xml` — browser ko batata hai ise search engine kaise banana hai
- `android/` — Android WebView wrapper project (APK banane ke liye)
- `README.md` — project overview

Koi server, database ya API key nahi. Results live aate hain **Wikipedia**,
**Internet Archive** aur **Wikimedia Commons** ke free public APIs se; baaki
engines (Google, Bing, YouTube, Google Scholar, etc.) ke links bhi diye jaate hain.

## Tabs

**All · AI · Images · Videos · YouTube · Papers · Data · OSINT · Books/EPUB · PDF · PPT · Drive · Terabox · Archive**

- **All** — AI summary (web results ka) + Wikipedia answer + articles + 8 general engines
- **AI** — **in-app jawab** (model chuno: Smart / Fast / Mistral; free, bina login, aapki bhasha me) + Sarvam Indus AI + ChatGPT, Perplexity, Gemini, Claude, Copilot, Grok, DeepSeek, You.com
- **Images** — Wikimedia Commons image grid + Google/Bing Images, Unsplash, Pexels, Openverse
- **Videos** — Internet Archive videos + YouTube, Vimeo, Dailymotion
- **Papers** — live results from Crossref, OpenAlex, arXiv + Google Scholar, Semantic Scholar, PubMed, CORE
- **Data** — live results from Zenodo, GDELT, Wikidata + Google Dataset Search, data.gov.in, data.gov, World Bank, UN Data
- **OSINT** — live results from GDELT, Wikidata, GLEIF, Wayback + crt.sh, urlscan.io, Shodan, OpenCorporates, OpenSanctions
- **Books/EPUB** — Internet Archive books + Project Gutenberg, Open Library, Standard Ebooks
- **PDF** — Internet Archive PDFs + `filetype:pdf` searches
- **PPT** — `filetype:ppt/pptx` + SlideShare
- **Drive** — public Google Drive folders/files (`site:drive.google.com`)
- **Terabox** — `site:terabox.com` / `site:teraboxapp.com` / `site:1024tera.com`
- **Archive** — everything on the Internet Archive + Wayback Machine

---

## Real web results (backend)

Dhoondh web results **isi page par** dikhata hai. Uske liye ek chhota server-side proxy
chahiye — `worker/` folder me ek free **Cloudflare Worker** hai — kyunki ek static page
seedha Google/DuckDuckGo/Brave se results nahi laa sakta (CORS + bot-blocking).

- **Backend ke bina:** All tab me setup card + hand-off buttons (Google, DuckDuckGo, Bing,
  Brave…) dikhte hain, aur Wikipedia / Internet Archive / Commons results page par hi aate hain.
- **Backend ke saath:** All tab me asli web results (default DuckDuckGo) isi page par dikhte hain.

### Lagane ka tareeka (dashboard me paste — sabse aasan, ~2 min)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**.
2. Naam: `dhoondh-search` → **Deploy**.
3. **Edit code** → editor ka sab kuch delete karo → `worker/worker.js` ka poora code paste karo.
4. **Deploy** dabao. URL milega: `https://dhoondh-search.<you>.workers.dev`
5. Dhoondh site ke footer me **"Web results backend"** me wo URL paste → **Save** → **Test**.

### Ya Deploy button se (Git-connected)

[Deploy karo](https://deploy.workers.cloudflare.com/?url=https://github.com/merry8989-uk/dhoondh/tree/main/worker) →
Project name `dhoondh-search`, Build command khaali, Deploy command `npx wrangler deploy`,
aur **Advanced settings → Root directory = `worker`** (yeh zaroori hai) → Deploy.

### Results nahi aa rahe?

- Footer me **Test** button dabao — exact HTTP status/result count dikhega.
- `BLOCKED` aata hai? DuckDuckGo ne bot-check diya (Cloudflare jaise datacenter IP se hota
  hai) → Worker me **BRAVE_API_KEY** (free tier) ya **SEARXNG_URL** set karo.
- `?debug=1` lagao: `https://<worker>/?q=ISRO&debug=1` — har attempt ka detail.

## 1. App ki tarah install karo (PWA — sabse aasan)

Koi APK ya store ki zaroorat nahi. Site ek PWA hai:

- **Android (Chrome):** site kholo → menu → **Add to Home screen** / **Install app**
  (header me "Install app" button bhi aa jaata hai jab available ho).
- **Desktop (Chrome/Edge):** address bar me install icon.
- **iPhone (Safari):** Share → **Add to Home Screen**.

App apni alag window me Dhoondh icon ke saath khulta hai, aur offline bhi shell chalta hai.

## 2. Android APK banao

Do tareeke:

**A. Bina code — PWABuilder (signed APK seedha milta hai):**
1. Kholo <https://www.pwabuilder.com/>
2. URL daalo: `https://merry8989-uk.github.io/dhoondh/` → **Start**
3. **Android** → **Generate Package** → `.apk` / `.aab` download karo (PWABuilder sign kar deta hai).

**B. Khud build karo (Android Studio):**
1. Is repo ka `android/` folder Android Studio me **Open** karo.
2. Gradle sync hone do.
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
   Detail: `android/README.md`.

> Note: ye environment (jahan ye files bani) me Java/Gradle/Android SDK nahi hai,
> isliye APK yahin build nahi hua — par `android/` project aur PWABuilder dono se
> aap turant APK bana sakte ho.

## 3. Browser me search engine add karo (Chrome / Edge)

1. Address bar me kholo: **https://merry8989-uk.github.io/dhoondh/**
2. Settings → **Search engine** → **Manage search engines and site search** → **Add**
3. Bharo:
   - **Search engine:** `Dhoondh`
   - **Shortcut:** `dh`
   - **URL with %s in place of query:** `https://merry8989-uk.github.io/dhoondh/?q=%s`
4. Save. Ab address bar me `dh` type karke **Tab** dabao, phir search karo.

## 4. Firefox me add karo

1. Kholo: **https://merry8989-uk.github.io/dhoondh/** — search-engine ("+") icon se add karo.
2. Ya search box me `opensearch.xml` ka pura URL daalo:
   `https://merry8989-uk.github.io/dhoondh/opensearch.xml`

---

## Apni copy host karna (optional)

- **GitHub Pages** — ye repo already isi ke liye ready hai. Settings → Pages →
  Branch `main`, folder `/ (root)` → Save.
- **Netlify Drop** — <https://app.netlify.com/drop> par saari files drag-and-drop karo.

Phir `opensearch.xml`, `manifest.webmanifest` aur Chrome ke URL me
`https://merry8989-uk.github.io/dhoondh/` ko apne URL se badal do.

## Diagnostics

Header me **Diagnostics** button hai. Usme device/browser/settings ki info aur app ke logs
(errors, failed/slow network calls, searches) dikhte hain.

- **Gmail (link)** — Gmail ka compose khulta hai (`br19shc39@gmail.com`, To/Subject/Body bhare hue) **aur log file download ho jaati hai** — bas attach kar do.
- **Share / Attach** — device ka share sheet; Android par **Gmail** chuno to log file **apne aap attach** ho jaati hai (kuch type karne ki zaroorat nahi).
- **Email app** — simple `mailto:` compose (koi bhi mail app), report pehle se bhari.

> Seedhi baat: web link se local file attach nahi ho sakti — koi mail client allow nahi karta. Android par **Share / Attach** se automatic attach hota hai; desktop par Gmail button sab bhar deta hai aur file download kar deta hai (bas ek baar drag karo).
- **Copy** — report clipboard me.
- **Download** — `.txt`, `.json`, `.md`, `.csv` (Excel/Sheets me khulti hai).
- **Refresh / Clear logs** — log dobara padho ya mita do.

Logs sirf aapke device par (localStorage) rehte hain — Email/Share dabane tak kahin nahi jaate.
Diagnostics **default ON** hain; toggle se off kar sakte ho.

### Logging standard (ProGallery Logging Spec v1.0)

Events **structured JSON** hain (free text nahi), aur shared envelope follow karte hain:
`event_name`, `schema_version`, `timestamp` (ISO-8601 UTC), `session_id`, `attempt_id`,
`user_id`, `platform`, `app_version`, `os`, `device_model`, `network_type`,
`screen_or_route`, `log_level`, `release_channel`.

- **Naming:** `object_action` snake_case — jaise `search_performed`, `api_call`, `js_error`.
- **Levels:** debug / info / warn / error. Errors 100%; info/debug buffer bharne par sampled.
- **Correlation:** `session_id` har visit ka; `attempt_id` intent → outcome ko jodta hai.
- **Retention:** 7 din / 500 events, load par enforce.
- **Validation:** har event store hone se pehle schema se validate hota hai (`schema_valid` field).
- **PII redaction (DPDP):** **raw search query kabhi log nahi hoti** — sirf `query_length`;
  API endpoint sirf host + route (jaise `/page/summary/ISRO` → `en.wikipedia.org/api/rest_v1`);
  full URLs with params, email/phone/name, raw file paths — kabhi nahi; `user_id` **salted hash**.
- **Consent:** toggle opt-out hai; default ON.
- **Events:** session_start, page_view, search_performed, search_no_results, api_call, js_error,
  web_vitals, form_start/submit/abandon, feedback_submitted, conversion, error_state_shown —
  aur friction signals: rage_click, dead_click, back_button_spam, scroll_depth, drop_off, time_to_first_value.

Jo static client se possible nahi (saaf-saaf): CI schema validation, server-side encryption at
rest, centrally enforced retention, aur session replay.

### User code aur log filter

- **User code** — har install ko ek random, padhne-layak code milta hai (jaise `DH-4F9-K2Q`), jo
  panel me dikhta hai aur har event par lagta hai — isse ek device ke rows ek saath rehte hain aur
  data saaf rehta hai. Ye pseudonym hai, personal data nahi.
- **Filter** — logs ko **level**, **event name** aur **free text** se filter karo; counter
  `shown / total` dikhata hai, aur **export bhi filter ke hisaab se hota hai** (sirf errors, ya ek
  event type export karo).
- **Notion** — events schema ek Notion database ("Dhoondh Diagnostics — Events") se match karta hai,
  jisme ready views hain: All events, Errors, Warnings, Friction signals, By user code. App ka
  `.csv` export usme import kar do.
- **Notion sync** — panel me **Sync to Notion** (manual) aur **Auto-sync** checkbox (background,
  default OFF) hai. Dono unsynced events ko aapke Worker ke `/notion` route par bhejte hain, jo
  unhe database me likh deta hai. Event sirf successful reply ke baad synced mark hota hai — kuch
  khota ya duplicate nahi hota. Ek-baar ka setup (Notion integration token + database share,
  Worker variables `NOTION_TOKEN` aur `NOTION_DB_ID`) `worker/README.md` me hai.

## Contact / Feedback

App ke header me **Feedback** button hai (aur footer me bhi contact line) — dono
seedha Instagram **[@osintgram_io](https://instagram.com/osintgram_io)** par le jaate
hain. Suggestion, feedback ya naya feature request wahin bhej sakte ho.

## Tips

- Seedha URL se bhi search: `https://merry8989-uk.github.io/dhoondh/?q=ISRO`
- Kisi tab ka seedha link: `...?q=ISRO&tab=papers`
- Page par `/` dabane se search box focus ho jaata hai.
- Dark mode aur mobile automatically support hai.

## Note on sources

Ye ek lightweight meta-search hai — poori web indexing nahi karta. In-page real
results Wikipedia / Internet Archive / Wikimedia Commons se aate hain; baaki tabs
target engine par naye tab me le jaate hain. Heavy production use ke liye kisi paid
search API (Brave Search API, Google Custom Search, Bing) ka use karna behtar hai.
