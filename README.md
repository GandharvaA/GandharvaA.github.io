# Gandharva Appagere: personal website and CV generator

Static personal website (Astro) plus a LaTeX CV generator that builds an
**industry CV (≤ 2 pages)** and a **full academic CV** from the same YAML data.

- Zero client-side frameworks, no cookies, no analytics, no third-party requests
  (fonts are self-hosted; a strict Content-Security-Policy is emitted on every page).
- Light ("paper") and dark ("blueprint") themes, respecting the OS preference.
- All content lives in `src/data/*.yaml` and `src/content/research/*.md`.

---

## 1. Project layout

```text
src/
  data/                 ← EDIT CONTENT HERE (YAML, read by site AND CV generator)
    profile.yaml        name, role, positioning, summaries, bio, links, siteUrl
    settings.yaml       feature flags + homepage counts
    capabilities.yaml   six lab-to-industry cards (/industry and the industry CV)
    experience.yaml     positions & projects (newest first)
    education.yaml      degrees, theses, supervisors
    publications.yaml   papers, proceedings, theses
    talks.yaml          conference talks + collaboration presentations
    teaching.yaml       courses and supervision
    service.yaml        councils, committees, lab responsibility, outreach
    grants.yaml         travel grants, scholarships, awards (no amounts)
    skills.yaml         grouped skills with level + industry relevance
    languages.yaml
    training.yaml       beam times, schools, workshops, research visits
  content/research/     one Markdown file per research project
  content.config.ts     schemas (validation errors show up at build time)
  components/           layout pieces; components/art/ = hand-made SVG figures
  components/demos/     optional interactive demo (behind the showDemos flag)
  pages/                routes (index, research, publications, talks, cv, about, industry, contact)
  lib/                  site config + data helpers
  styles/global.css     design tokens (colours, type scale) for both themes
cv/templates/           LaTeX class + industry/academic templates
scripts/build-cv.mjs    YAML → LaTeX → PDF (xelatex)
public/cv/              generated PDFs (committed, served as /cv/*.pdf)
.github/workflows/      GitHub Pages deployment
```

## 2. Editing content

Everything is plain YAML. Lists are displayed **in file order**, so keep them
newest-first. Common fields:

| Field | Meaning |
| --- | --- |
| `hidden: true` | hide the entry everywhere (site and both CVs) |
| `cv: both \| academic \| industry \| none` | which PDF CV(s) include the entry (default `both`) |
| `selected: true` (publications) | show on the homepage |
| `type: collaboration` (talks) | goes into "Collaboration presentations", not the conference list |

Examples:

- **New talk:** add an entry at the top of `talks.yaml`
  (`date: "2026-11-05"`, `type: contributed | invited | talk | collaboration`).
- **New publication:** add to `publications.yaml`; set `doi:` or `arxiv:` once known
  and change `status` (`in-preparation → submitted → accepted → in-press → published`).
- **Research page:** edit `src/content/research/*.md`. The front-matter controls
  title, summary, tags and which SVG figure is shown.
- **Links** (GitHub, LinkedIn, ORCID, …): fill in `links:` in `profile.yaml`.
  An empty `url: ""` hides the link everywhere.

- **Social preview / touch icon:** edit `scripts/og-image.svg` or
  `scripts/apple-touch-icon.svg`, then re-render (needs `rsvg-convert`, e.g.
  `brew install librsvg`):

  ```sh
  rsvg-convert -w 1200 -h 630 scripts/og-image.svg -o public/og-image.png
  rsvg-convert -w 180 -h 180 scripts/apple-touch-icon.svg -o public/apple-touch-icon.png
  ```

Lines marked `# TODO verify:` are facts that still need confirming. List them with:

```sh
grep -rn "TODO verify" src/data src/content
```

Privacy rule of thumb: the site deliberately contains no phone number, home address,
date of birth, grades, grant amounts or student names. Keep it that way.

## 3. Running locally

Requirements: Node ≥ 22.12 (here via conda env `personal-website`).

```sh
conda activate personal-website
npm install
npm run dev        # http://localhost:4321, live reload
npm run build      # production build into dist/
npm run preview    # serve dist/ locally
npx astro check    # optional type check (needs: npm i -D @astrojs/check typescript)
```

## 4. Rebuilding the CVs

Requirements: a TeX distribution with `xelatex` (TeX Live / MacTeX; BasicTeX works).

```sh
npm run cv                                  # both PDFs → public/cv/
node scripts/build-cv.mjs --only industry   # just one
npm run build:all                           # CVs, then the website
```

- Output: `public/cv/cv-industry.pdf` and `public/cv/cv-academic.pdf`.
- LaTeX intermediates go to `cv/build/` (git-ignored).
- The script **fails if the industry CV exceeds two pages**. Trim `cv: industry`
  items, highlights or skills until it fits.
- Layout/typography: `cv/templates/cv-common.cls`; section order:
  `cv/templates/industry.tex` and `academic.tex`.
- The PDFs are committed, so GitHub Actions does not need LaTeX. **Re-run
  `npm run cv` and commit the PDFs whenever you change CV-relevant YAML.**

## 5. Feature flags (`src/data/settings.yaml`)

| Flag | Default | Effect |
| --- | --- | --- |
| `showDemos` | `false` | `true` generates `/demos/` (interactive sideband-subtraction demo), adds it to the nav and sitemap. `false` = page not built at all. |
| `showPhotographyLink` | `true` | shows a "Photography" link in the footer and on the About page **if** `photographyUrl` in `profile.yaml` is set |
| `analytics` | `null` | reserved; no analytics code exists. If you ever add one, also extend the CSP in `astro.config.mjs` and update the privacy note in the footer. |
| `home.selectedPublications` / `home.selectedTalks` | 3 / 4 | how many items the homepage shows |

## 6. Deploying to GitHub Pages (step by step)

1. Create a GitHub account (if needed). Decide the username. The site will live at
   `https://USERNAME.github.io`.
2. Create a **public** repository named exactly `USERNAME.github.io`
   (a user site, served from the root; no `base` path needed).
   *If you use another repo name, the site is served at `/REPO/` and you must add
   `base: '/REPO'` in `astro.config.mjs`.*
3. Set `siteUrl: https://USERNAME.github.io` in `src/data/profile.yaml`
   (used for canonical URLs, the sitemap and social previews).
4. Commit and push:

   ```sh
   git add -A
   git commit -m "Initial website"
   git remote add origin git@github.com:USERNAME/USERNAME.github.io.git
   git push -u origin main
   ```

5. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
6. The workflow `.github/workflows/deploy.yml` builds and deploys on every push to
   `main` (or manually via *Actions → Deploy to GitHub Pages → Run workflow*).
   The first deploy takes ~1–2 minutes.

### Mirror pushes to the SU GitLab as well

Keep GitHub as the deploy target and push the same commits to GitLab in one go:

```sh
git remote set-url --add --push origin git@github.com:USERNAME/USERNAME.github.io.git
git remote set-url --add --push origin git@gitlab.fysik.su.se:gandharva.appagere/personal-website.git
git remote -v      # origin now has two (push) URLs
git push           # pushes to both
```

(The first `--add --push` line is required: once any push URL is set, the fetch URL
is no longer used for pushing.)

## 7. Custom domain (optional, e.g. via Cloudflare)

1. Buy/manage the domain (Cloudflare Registrar or any registrar using Cloudflare DNS).
2. DNS records (Cloudflare → DNS), **proxy status "DNS only" (grey cloud)** at first so
   GitHub can issue the TLS certificate:
   - apex `example.com`: four `A` records → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (optionally the `AAAA` equivalents)
   - `www`: `CNAME` → `USERNAME.github.io`
3. Add a file `public/CNAME` containing just the domain (e.g. `example.com`).
4. GitHub → Settings → Pages → Custom domain → enter the domain → wait for the
   check → tick **Enforce HTTPS**.
5. Set `siteUrl: https://example.com` in `profile.yaml`, rebuild, push.
6. Once HTTPS works you may turn the Cloudflare proxy on (SSL mode **Full (strict)**).

## 8. Google Search Console

1. <https://search.google.com/search-console> → *Add property* → **URL prefix** →
   your `siteUrl`.
2. Verify with the *HTML tag* method: add the `<meta name="google-site-verification" …>`
   tag to `src/components/Head.astro`, push, then click *Verify*.
   (With a custom domain on Cloudflare you can use the DNS TXT method instead.)
3. *Sitemaps* → submit `sitemap-index.xml`. `robots.txt` already points to it.

## 9. Nextcloud / sync note

This project sits in a synced folder. Exclude generated folders from syncing
(Nextcloud desktop client → *Settings → Edit ignored files*, or add to
`.sync-exclude.lst`):

```text
node_modules
dist
.astro
cv/build
```

They are all reproducible (`npm install`, `npm run build`, `npm run cv`) and
`node_modules` alone contains tens of thousands of files.

## 10. Privacy & security

- No cookies, trackers, analytics or external requests; fonts are bundled.
- The e-mail address is assembled by a small script (plain-text fallback
  "name [at] domain") to reduce scraping.
- A Content-Security-Policy `<meta>` tag with hashes for every inline script/style is
  generated at build time (`security.csp` in `astro.config.mjs`). Inline
  `style="…"` attributes are therefore not allowed. Use classes.
