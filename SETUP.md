# Dhoondh — apna search engine (setup)

Ek simple multi-tab search engine jo aap apne browser ke **"Add search engine"** me
add kar sakte ho. Iski apni public website bhi hai:

**https://merry8989-uk.github.io/dhoondh/**

## Files

- `index.html` — search page (yahi aapka engine hai)
- `opensearch.xml` — browser ko batata hai ise search engine kaise banana hai
- `favicon.svg` — chhota icon
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

## Add to Chrome / Edge

1. Address bar me kholo: **https://merry8989-uk.github.io/dhoondh/**
2. Settings → **Search engine** → **Manage search engines and site search** → **Add**
3. Bharo:
   - **Search engine:** `Dhoondh`
   - **Shortcut:** `dh`
   - **URL with %s in place of query:** `https://merry8989-uk.github.io/dhoondh/?q=%s`
4. Save. Ab address bar me `dh` type karke **Tab** dabao, phir kuchh bhi search karo.

## Add to Firefox

1. Kholo: **https://merry8989-uk.github.io/dhoondh/** — page par search-engine
   ("+") icon dikhega, usse add karo (OpenSearch autodiscovery `index.html` me laga hai).
2. Ya search box me `opensearch.xml` ka pura URL daalo:
   `https://merry8989-uk.github.io/dhoondh/opensearch.xml`

---

## Apni copy host karna (optional)

Chaho to ye files apne kisi bhi static host par daal sakte ho:

- **GitHub Pages** — ye repo already isi ke liye ready hai. Settings → Pages →
  Source: "Deploy from a branch" → Branch `main`, folder `/ (root)` → Save.
  URL milega `https://<username>.github.io/dhoondh/`.
- **Netlify Drop** — <https://app.netlify.com/drop> par saari files ek folder me
  drag-and-drop karo, turant URL mil jaayega.

Phir `opensearch.xml` me `https://merry8989-uk.github.io/dhoondh/` ko apne URL se
badal do, aur Chrome me wahi URL `?q=%s` ke saath daalo.

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
