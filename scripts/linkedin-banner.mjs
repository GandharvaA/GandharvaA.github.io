#!/usr/bin/env node
/**
 * LinkedIn cover: film-gate monogram + Fig. 1 detector / ΛΛ artwork.
 * Output: exports/linkedin-banner.svg and .png (1584 × 396).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'exports');
mkdirSync(outDir, { recursive: true });

const W = 1584;
const H = 396;
const PAPER = '#f6f1e7';
const INK = '#1d1b16';
const INK_SOFT = '#57513f';
const ACCENT = '#b03f27';
const ACCENT2 = '#2b6a6e';
const ART = '#1d1b16';

const r1 = (n) => Math.round(n * 10) / 10;
/** @typedef {[number, number]} Pt */
/** @type {Pt} */
const C = [232, 262];
const rings = [44, 74, 98, 122, 146];
const rOut = 186;
const dist = (p) => Math.hypot(p[0] - C[0], p[1] - C[1]);
const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return /** @type {Pt} */ ([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]);
};

function track(start, phiDeg, R, q, rMax = rOut - 8) {
  const phi = (phiDeg * Math.PI) / 180;
  const O = /** @type {Pt} */ ([start[0] - q * R * Math.sin(phi), start[1] + q * R * Math.cos(phi)]);
  const th0 = Math.atan2(start[1] - O[1], start[0] - O[0]);
  /** @type {Pt[]} */
  const pts = [start];
  /** @type {Pt[]} */
  const hits = [];
  let prev = start;
  for (let s = 2; s < 600; s += 2) {
    const th = th0 + (q * s) / R;
    const p = /** @type {Pt} */ ([O[0] + R * Math.cos(th), O[1] + R * Math.sin(th)]);
    for (const r of rings) {
      const a = dist(prev) - r;
      const b = dist(p) - r;
      if (a < 0 && b >= 0) {
        const t = a / (a - b);
        hits.push([prev[0] + t * (p[0] - prev[0]), prev[1] + t * (p[1] - prev[1])]);
      }
    }
    pts.push(p);
    prev = p;
    if (dist(p) >= rMax) break;
  }
  return { d: 'M' + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join('L'), hits };
}

const primaries = [
  { phi: -150, R: 150, q: 1 },
  { phi: -100, R: 108, q: -1 },
  { phi: -48, R: 260, q: 1 },
  { phi: 76, R: 125, q: 1 },
  { phi: 128, R: 210, q: -1 },
  { phi: 196, R: 112, q: -1 },
].map((t) => track(C, t.phi, t.R, t.q));

const vertex = polar(58, 8);
const lambdaDecay = [
  { ...track(vertex, -6, 520, 1), cls: 'proton' },
  { ...track(vertex, 34, 140, -1), cls: 'pion' },
];

const spokes = [30, 90, 150, 210, 270, 330];
const band = [];
for (let k = 0; k < 40; k++) {
  const a0 = (k * 9 + 0.9) * (Math.PI / 180);
  const a1 = ((k + 1) * 9 - 0.9) * (Math.PI / 180);
  const r = 172;
  band.push(
    `M${r1(C[0] + r * Math.cos(a0))} ${r1(C[1] + r * Math.sin(a0))}A${r} ${r} 0 0 1 ${r1(C[0] + r * Math.cos(a1))} ${r1(C[1] + r * Math.sin(a1))}`,
  );
}

const Hx = { x: 502, y: 36, s: 196, n: 14 };
const cell = Hx.s / Hx.n;
const intensity = (i, j) => {
  const x = (i + 0.5) / Hx.n;
  const y = (j + 0.5) / Hx.n;
  const comb = 0.34 * Math.exp(-1.35 * (x + y));
  const peak = Math.exp(-((x - 0.5) ** 2 + (y - 0.5) ** 2) / (2 * 0.026 ** 2));
  return Math.min(1, comb + 0.05 + peak);
};
const cells = Array.from({ length: Hx.n }, (_, i) =>
  Array.from({ length: Hx.n }, (_, j) => {
    const v = intensity(i, j);
    return {
      x: r1(Hx.x + i * cell + 0.7),
      y: r1(Hx.y + (Hx.n - 1 - j) * cell + 0.7),
      v,
      hot: v > 0.55,
    };
  }),
).flat();

const box = (x0, x1, y0, y1) => ({
  x: r1(Hx.x + x0 * Hx.s),
  y: r1(Hx.y + (1 - y1) * Hx.s),
  w: r1((x1 - x0) * Hx.s),
  h: r1((y1 - y0) * Hx.s),
});
const signal = box(0.42, 0.58, 0.42, 0.58);
const sidebands = [
  box(0.26, 0.38, 0.42, 0.58),
  box(0.62, 0.74, 0.42, 0.58),
  box(0.42, 0.58, 0.26, 0.38),
  box(0.42, 0.58, 0.62, 0.74),
];
const cx = Hx.x + 0.5 * Hx.s;
const cy = Hx.y + 0.5 * Hx.s;
const ellipse = (rx, ry) => {
  const pts = [];
  for (let k = 0; k <= 80; k++) {
    const a = (k / 80) * Math.PI * 2;
    pts.push(`${r1(cx + rx * Math.cos(a))} ${r1(cy + ry * Math.sin(a))}`);
  }
  return 'M' + pts.join('L') + 'Z';
};

const feedSources = [-32, -12, 10, 30].map((a) => polar(rOut + 6, a));
const feeds = feedSources.map((p, i) => {
  const y = Hx.y + ((i + 0.5) / feedSources.length) * Hx.s;
  return `M${r1(p[0])} ${r1(p[1])}C${r1(p[0] + 78)} ${r1(p[1])} ${Hx.x - 48} ${r1(y)} ${Hx.x} ${r1(y)}`;
});

// Crop Fig. 1 to detector + 2D histogram (skip the lower 1D plot for the short banner).
const artView = { x: 8, y: 8, w: 724, h: 268 };
const artScale = Math.min((W - 360) / artView.w, (H - 48) / artView.h);
const artTx = 300;
const artTy = (H - artView.h * artScale) / 2 - artView.y * artScale;

const monogram = (() => {
  const rows = [16, 23.5, 31, 38.5, 46];
  const holesL = rows.map((y) => `<rect x="8.9" y="${y}" width="3.7" height="3.7" rx="0.45" fill="${ART}"/>`).join('');
  const holesR = rows
    .map((y, i) =>
      i === rows.length - 1
        ? `<rect x="51.4" y="${y}" width="3.7" height="3.7" rx="0.45" fill="${ACCENT}"/>`
        : `<rect x="51.4" y="${y}" width="3.7" height="3.7" rx="0.45" fill="${ART}"/>`,
    )
    .join('');
  return `
  <g transform="translate(72 78) scale(3.75)">
    <circle cx="32" cy="32" r="28" fill="none" stroke="${ART}" stroke-width="1.5"/>
    <rect x="17" y="14" width="30" height="36" rx="2" fill="none" stroke="${ACCENT2}" stroke-width="1.45"/>
    ${holesL}${holesR}
    <text x="32" y="36.5" text-anchor="middle" font-family="Iowan Old Style, Georgia, 'Times New Roman', serif"
      font-size="15" font-weight="650" fill="${INK}" letter-spacing="-0.03em">GA</text>
  </g>`;
})();

const detector = `
  <g fill="none" stroke="${ART}">
    ${spokes
      .map((a) => {
        const p0 = polar(30, a);
        const p1 = polar(rOut + 6, a);
        return `<line x1="${r1(p0[0])}" y1="${r1(p0[1])}" x2="${r1(p1[0])}" y2="${r1(p1[1])}" stroke-width="0.8" opacity="0.45"/>`;
      })
      .join('')}
    <circle cx="${C[0]}" cy="${C[1]}" r="${rings[0]}" stroke-width="1.1"/>
    ${rings
      .slice(1)
      .map((r) => `<circle cx="${C[0]}" cy="${C[1]}" r="${r}" stroke-width="1.1" stroke-dasharray="2 3" opacity="0.7"/>`)
      .join('')}
    ${band.map((d) => `<path d="${d}" stroke-width="11" opacity="0.13"/>`).join('')}
    <circle cx="${C[0]}" cy="${C[1]}" r="${rOut}" stroke-width="1.3"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="3.2" fill="${ART}" stroke="none"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="7" stroke-width="1"/>
  </g>
  <g fill="none" stroke-linecap="round">
    ${primaries.map((t) => `<path d="${t.d}" stroke="${ART}" stroke-width="1.5"/>`).join('')}
    <line x1="${C[0]}" y1="${C[1]}" x2="${r1(vertex[0])}" y2="${r1(vertex[1])}" stroke="${ACCENT}" stroke-width="1.4" stroke-dasharray="3 4"/>
    ${lambdaDecay.map((t) => `<path d="${t.d}" stroke="${ACCENT}" stroke-width="2"/>`).join('')}
    <circle cx="${r1(vertex[0])}" cy="${r1(vertex[1])}" r="3" fill="${PAPER}" stroke="${ACCENT}" stroke-width="1.5"/>
  </g>
  <g>
    ${primaries
      .flatMap((t) => t.hits)
      .map((h) => `<circle cx="${r1(h[0])}" cy="${r1(h[1])}" r="2.3" fill="${PAPER}" stroke="${ART}" stroke-width="1.2"/>`)
      .join('')}
    ${lambdaDecay
      .flatMap((t) => t.hits)
      .map((h) => `<circle cx="${r1(h[0])}" cy="${r1(h[1])}" r="2.6" fill="${ACCENT}" stroke="${ACCENT}"/>`)
      .join('')}
  </g>
  <text x="${r1(vertex[0]) - 8}" y="${r1(vertex[1]) - 12}" font-family="Menlo, Consolas, monospace" font-size="12" fill="${ACCENT}" font-weight="600">Λ → p π⁻</text>
`;

const hist2d = `
  <g>
    ${feeds.map((d) => `<path d="${d}" fill="none" stroke="${ART}" stroke-width="1.15" opacity="0.8"/>`).join('')}
    <rect x="${Hx.x}" y="${Hx.y}" width="${Hx.s}" height="${Hx.s}" fill="none" stroke="${ART}" stroke-width="1.1"/>
    ${cells
      .filter((c) => c.v > 0.18)
      .map(
        (c) =>
          `<rect x="${c.x}" y="${c.y}" width="${r1(cell - 2.2)}" height="${r1(cell - 2.2)}" fill="${c.hot ? ACCENT : ART}" opacity="${c.hot ? 0.8 : r1(0.08 + c.v * 0.28)}"/>`,
      )
      .join('')}
    ${sidebands
      .map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${ACCENT2}" opacity="0.14"/>`)
      .join('')}
    <rect x="${signal.x}" y="${signal.y}" width="${signal.w}" height="${signal.h}" fill="${ACCENT}" opacity="0.12"/>
    <path d="${ellipse(0.13 * Hx.s, 0.118 * Hx.s)}" fill="none" stroke="${ACCENT}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.85"/>
    <path d="${ellipse(0.075 * Hx.s, 0.068 * Hx.s)}" fill="none" stroke="${ACCENT}" stroke-width="2"/>
    <text x="${Hx.x + Hx.s}" y="${Hx.y + Hx.s + 16}" text-anchor="end" font-family="Menlo, Consolas, monospace" font-size="11" fill="${INK_SOFT}">m(pπ⁻)₁</text>
    <text x="${Hx.x - 8}" y="${Hx.y + 10}" text-anchor="end" font-family="Menlo, Consolas, monospace" font-size="11" fill="${INK_SOFT}">m(pπ⁻)₂</text>
    <text x="${cx}" y="${cy - 26}" text-anchor="middle" font-family="Menlo, Consolas, monospace" font-size="13" fill="${ACCENT}" font-weight="600">ΛΛ</text>
  </g>
`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="minor" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="${INK}" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
    <pattern id="major" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M120 0H0V120" fill="none" stroke="${INK}" stroke-opacity="0.09" stroke-width="1"/>
    </pattern>
    <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${PAPER}" stop-opacity="1"/>
      <stop offset="0.55" stop-color="${PAPER}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${PAPER}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect width="${W}" height="${H}" fill="url(#minor)"/>
  <rect width="${W}" height="${H}" fill="url(#major)"/>

  ${monogram}

  <g transform="translate(${artTx} ${artTy}) scale(${r1(artScale)})">
    ${detector}
    ${hist2d}
  </g>

  <!-- Soft veil over the left so the logo stays readable against the art -->
  <rect x="0" y="0" width="340" height="${H}" fill="url(#fadeL)"/>
  ${monogram}

  <text x="84" y="340" font-family="Menlo, Consolas, monospace" font-size="13" letter-spacing="0.12em" fill="${INK_SOFT}">PHYSICS · INSTRUMENTATION · AI</text>
</svg>
`;

const svgPath = join(outDir, 'linkedin-banner.svg');
const pngPath = join(outDir, 'linkedin-banner.png');
writeFileSync(svgPath, svg);
execFileSync('rsvg-convert', ['-w', String(W), '-h', String(H), '-o', pngPath, svgPath], { stdio: 'inherit' });
console.log(`Wrote ${svgPath}`);
console.log(`Wrote ${pngPath} (${W}×${H})`);
