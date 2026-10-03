// @ts-check
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { parse } from 'yaml';

const profile = parse(readFileSync(new URL('./src/data/profile.yaml', import.meta.url), 'utf8'));
const site = (profile.siteUrl || 'https://USERNAME.github.io').replace(/\/$/, '');

// is:inline scripts are not hashed by Astro; Head.astro inlines this file verbatim (trimmed).
const themeInit = readFileSync(new URL('./src/scripts/theme-init.js', import.meta.url), 'utf8').trim();
const themeInitHash = `sha256-${createHash('sha256').update(themeInit).digest('base64')}`;

export default defineConfig({
  site,
  compressHTML: true,
  trailingSlash: 'ignore',
  markdown: { syntaxHighlight: false },
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  security: {
    csp: {
      algorithm: 'SHA-256',
      scriptDirective: { hashes: [themeInitHash] },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'none'",
        "object-src 'none'",
      ],
    },
  },
});
