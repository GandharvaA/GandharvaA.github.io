# Notes for coding agents

Personal website (Astro 7, static) + LaTeX CV generator for Gandharva Appagere.
See README.md for the full workflow.

## Ground rules

- Content lives only in `src/data/*.yaml` and `src/content/research/*.md`; pages and
  `scripts/build-cv.mjs` read from there. Do not hard-code content in components.
- Never add: phone, address, date of birth, citizenship, personal ID numbers, grades,
  grant amounts, student or mentor names, or numerical physics results
  (cross-sections, limits, yields).
- Never name specific companies as target employers; use generic sectors.
- Home, research, publications, talks, about, and contact are a factual snapshot
  ("What I do"). The positioning sentence, the six capability cards, and the
  sector list live only on `/industry` and in the industry CV. The academic CV
  stays academic. `profile.availability` is for `/industry` and the industry CV.
- No em dashes in prose a reader sees. Use commas, colons, parentheses, or new
  sentences. Keep hyphens and numeric ranges (2021–2027, Λ-Λ).
- Talks: hide Physics Working Group, Exclusive Channels, task-force, and
  analysis-meeting talks with `hidden: true` (do not delete them). Keep
  collaboration meetings, Swedish Nuclear Physicists / SFAIR meetings, the
  Nordic Meeting on Nuclear Physics, and the public conferences.
- Do not write outside this repository (not under `Ph_D_Year_*`). Do not publish
  preliminary HADES numbers. `/demos` exists only when `showDemos` is true.
- Uncertain facts get a `# TODO verify: <reason>` comment on their own YAML line
  (never inside a folded `>-` block, where it would become visible text).
- Strict CSP: no inline `style=""` attributes, no `define:vars`, no external
  requests (fonts are self-hosted via @fontsource).
- SVG draw-on animation: elements with class `stroke` need `pathLength="1"`; dashed
  lines must use class `fade` instead. Do not use `vector-effect: non-scaling-stroke`
  on animated elements (it breaks `pathLength`).

## Commands

Node comes from the conda env `personal-website`:

```sh
source ~/miniconda3/etc/profile.d/conda.sh && conda activate personal-website
npm run dev          # dev server (localhost:4321)
npm run build        # static build → dist/
npm run cv           # CV PDFs → public/cv/ (needs xelatex; industry CV must stay ≤ 2 pages)
npm run build:all
```

Astro docs: https://docs.astro.build
