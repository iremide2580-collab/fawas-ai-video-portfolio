# Fawas AI Video Portfolio

A single-page, dark cinematic portfolio. Plain HTML/CSS/JS — no build step, no dependencies. Open `index.html` or upload the folder to any static host.

```
index.html                 page structure (sections, lightbox markup)
assets/css/styles.css      all styling + responsive rules
assets/js/data.js          ← ALL editable content lives here
assets/js/main.js          gallery, filters, lazy-load, autoplay, lightbox, form
assets/videos/             put the 7 MP4s here (exact filenames below)
assets/posters/            thumbnails, generated from the videos
assets/img/                og-image.png (social share) + about-portrait.svg
scripts/generate-posters.sh   extracts a first-frame poster for each video
```

## 1. Add the videos

Drop the files straight into `assets/videos/` — keep these exact names, because `assets/js/data.js` points at them:

| # | Filename | Length | Orientation |
|---|----------|--------|-------------|
| 1 | `Fawas_20261126183101.mp4` | 1:02 | 16:9 — hero showreel + featured card |
| 2 | `Editing_GTA_6_gameplay_footage_e64e094a.mp4` | 0:06 | 16:9 |
| 3 | `Video_editing_skills_gameplay_clips_fd8a9db8.mp4` | 0:06 | 16:9 |
| 4 | `Untitled_Scene_11-24_02_48_43_20261124035055.mp4` | 0:12 | 16:9 |
| 5 | `Untitled_Scene_11-24_03_37_37_20261124044333.mp4` | 0:24 | 16:9 |
| 6 | `Untitled_Scene_11-24_03_58_05_20261124050358.mp4` | 0:24 | 16:9 |
| 7 | `Untitled_Scene_11-24_17_10_33_20261124181129.mp4` | 0:16 | **9:16 vertical** |

Until a file is present, its card shows a "Preview unavailable" placeholder with the missing filename — the rest of the page keeps working.

If you rename a file, update its `src` (and `poster`) entry in `data.js`.

## 2. Generate the thumbnails

With [ffmpeg](https://ffmpeg.org) installed, from the project root:

```bash
./scripts/generate-posters.sh
```

That writes `assets/posters/<video-name>.jpg` (a frame from ~1s in, max 1280px wide) for every MP4. The filenames already match `data.js`, so nothing else to change. Want a custom poster? Drop a JPG with the same name in that folder and it wins.

## 3. Edit the text

Everything is in **`assets/js/data.js`**:

- `videos[]` — title, label, duration, category, orientation, `src`, `poster`
- `hero` — eyebrow, headline, subline, tagline, the three meta bullets
- `about` — bio, secondary line, skills chips, tools list
- `services[]` — the three service cards
- `contact` — email, social URLs, and optional `formEndpoint`

Placeholders to replace: bio, `assets/img/about-portrait.svg`, and the video titles. The “Photo placeholder” caption is in `index.html`. Contact details are already filled in — `fawas5654@gmail.com` and WhatsApp `0802 400 3609` (`https://wa.me/2348024003609`); Instagram / YouTube / TikTok links were removed.

**Contact form:** it validates, then opens the visitor's email app with the message prefilled and addressed to `contact.email`. To collect messages in a form service instead, set `contact.formEndpoint` (Formspree, Netlify Forms, or your own endpoint) — the form then `POST`s `{ name, email, message }` as JSON and stops using the mail app.

**Cache note:** the stylesheet and scripts are linked with `?v=3`. If you edit them and your browser/host still serves the old copy, bump that number in `index.html`.

## 4. Deploy — GitHub Pages

This folder is the whole site. It is published from `main` on GitHub Pages:

**Live site:** https://iremide2580-collab.github.io/fawas-ai-video-portfolio/
**Repo:** https://github.com/iremide2580-collab/fawas-ai-video-portfolio

Settings live at **Settings → Pages**: Source "Deploy from a branch", branch `main`, folder `/ (root)`. The `.nojekyll` file stops GitHub from running Jekyll, so every file is served exactly as committed.

To publish a change: edit a file, commit and push to `main`. Pages rebuilds in about a minute. If a browser still shows the old CSS/JS, hard-refresh or bump the `?v=3` number in `index.html`.

### Adding the videos on GitHub

`assets/videos/` is empty in the repo, so every card currently shows its "Preview unavailable" placeholder. To make them play:

1. Open the repo → `assets/videos` → **Add file → Upload files**.
2. Drop the MP4s in, keeping the exact filenames from the table above, then **Commit changes**.
3. GitHub's web uploader accepts files up to 25 MB each and rejects anything over 100 MB. For bigger clips use [GitHub Desktop](https://desktop.github.com) or a normal `git push`.
4. Thumbnails: run `./scripts/generate-posters.sh` locally (needs ffmpeg) and upload `assets/posters/*.jpg` the same way, or just upload the videos — the browser shows a black frame until a poster is added.

The Open Graph URLs in `index.html` already point at the live Pages domain, so social previews resolve.

## Behaviour notes

- Only the most visible card (or the hovered one on desktop) plays; everything else pauses, and all media pauses when the tab is hidden.
- Videos below the fold load lazily (`IntersectionObserver`, `preload="metadata"`), so the first paint doesn't fetch 127 MB.
- Vertical edits render at 9:16 in a tall card and are letterboxed (`object-fit: contain`) in the lightbox — never stretched or cropped.
- Keyboard: tab to a card, <kbd>Enter</kbd> opens the player, <kbd>←</kbd>/<kbd>→</kbd> browse, <kbd>Esc</kbd> closes and returns focus to the card you came from.
- `prefers-reduced-motion` disables reveals, smooth scrolling and autoplay previews.
