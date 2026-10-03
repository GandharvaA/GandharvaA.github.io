---
name: personal-website
description: >-
  Editorial and build rules for Gandharva Appagere's personal website and CV
  generator. Use when editing the Astro site, YAML content, research pages,
  talks, CV templates, or copy in
  /Users/curiosityga/Documents/SU_Doctoral_Studies/Projects/personal-website,
  including requests about the homepage, /industry, talks, em dashes, showDemos,
  or the industry and academic PDFs.
---

# Personal website

Repository (do not write anywhere else, especially not `Ph_D_Year_*`):

`/Users/curiosityga/Documents/SU_Doctoral_Studies/Projects/personal-website`

Prefix every command:

```sh
source ~/miniconda3/etc/profile.d/conda.sh && conda activate personal-website && cd /Users/curiosityga/Documents/SU_Doctoral_Studies/Projects/personal-website &&
```

Do not git commit unless asked. Do not create GitHub or GitLab remotes.

## Content

- Editable content lives in `src/data/*.yaml` and `src/content/research/*.md`. Pages and `scripts/build-cv.mjs` read from there.
- Home, research, publications, talks, about, and contact are a factual academic snapshot. The home section is **What I do** (HADES ΛΛ measurement, CBM cusp simulations, detectors, analysis; teaching or service only if brief).
- Selling copy lives only on `/industry` (nav label **For industry**, not styled louder than the other items) and in the industry CV: `profile.positioning` ("The premise"), the six capability cards, `profile.sectors`, `profile.availability`, and `profile.industrySummary`. The academic CV stays academic.
- The home epigraph is Carl Sagan, from *Pale Blue Dot*: "Astronomy is a humbling and character-building experience." Do not put that sentence in quotation marks with "Science" substituted for "Astronomy", and do not put `positioning` on the home page.
- `showDemos` in `src/data/settings.yaml` gates `/demos` (page, nav, sitemap). Leave it false unless asked.
- Do not publish preliminary HADES numbers (cross-sections, limits, yields). No phone, address, date of birth, grades, grant amounts, or student names. Do not name target companies.

## Prose

No em dashes (—) in prose a reader sees (YAML, markdown, page copy, CV template sentences). Use a comma, colon, parentheses, or a new sentence. Do not use an en dash as a parenthetical dash. Keep hyphens in compounds and ranges (`2021–2027`, `Λ-Λ`, `proton–proton`).

## Talks

`src/data/talks.yaml` feeds the site and both PDFs. Prefer `hidden: true` over deleting an entry. Hidden entries must not appear on the site or in either PDF.

Hide: Physics Working Group (PWG) talks, HADES/CBM Exclusive Channels and other working-group updates, the Λ-Reconstruction Task Force, and analysis meetings that are not collaboration meetings (for example HADES Analysis Meeting).

Keep: HADES Collaboration Meeting and CBM Collaboration Meeting; Swedish Nuclear Physicists / SFAIR meetings; the Nordic Meeting on Nuclear Physics; public conferences already listed (HYP2025, DPG 2026, NSTAR 2026, Fysikdagarna).

After hiding, recount homepage selected talks and any "N conference talks" figures. On the talks page, do not render an empty group heading.

## Check

```sh
npm run cv    # both PDFs; industry CV must stay ≤ 2 pages (pdfinfo or mdls)
npm run build
```

If port 4321 already has `astro dev`, do not start a second server. If nothing is serving the dev site, start `npx astro dev --background --port 4321`. Do not stop a dev server the user may be viewing.
