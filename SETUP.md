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

**All · AI · Images · Videos · YouTube · Papers · Books/EPUB · PDF · PPT · Drive · Terabox · Archive**

- **All** — Wikipedia answer + articles + 8 general engines
- **AI** — Sarvam **Indus AI** (highlighted) + ChatGPT, Perplexity, Gemini, Claude, Copilot, Grok, DeepSeek, You.com
- **Images** — Wikimedia Commons image grid + Google/Bing Images, Unsplash, Pexels, Openverse
- **Videos** — Internet Archive videos + YouTube, Vimeo, Dailymotion
- **Papers** — Internet Archive texts + Google Scholar, arXiv, Semantic Scholar, OpenAlex, CORE, PubMed
- **Books/EPUB** — Internet Archive books + Project Gutenberg, Open Library, Standard Ebooks
- **PDF** — Internet Archive PDFs + `filetype:pdf` searches
- **PPT** — `filetype:ppt/pptx` + SlideShare
- **Drive** — public Google Drive folders/files (`site:drive.google.com`)
- **Terabox** — `site:terabox.com` / `site:teraboxapp.com` / `site:1024tera.com`
- **Archive** — everything on the Internet Archive + Wayback Machine

---

## Default search engine

By default Dhoondh aapki search **DuckDuckGo** par bhejta hai. Header me **"Search with"**
selector hai — DuckDuckGo (default), Google, Brave, Bing, Yandex, Startpage chuno, aur har
search wahin asli web results ke saath khulegi. **"Dhoondh (tabs)"** chuno to in-app tabs
wala experience milega (Wikipedia + Internet Archive + Commons + saare tabs).

Kyun hand-off? DuckDuckGo/Google/Brave/Yandex koi public, CORS-friendly results API nahi
dete, isliye ek static page unke results embed nahi kar sakta — khol deta hai. In-app tabs
wo free sources use karte hain jo allow karte hain (Wikipedia, Internet Archive, Commons).

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
