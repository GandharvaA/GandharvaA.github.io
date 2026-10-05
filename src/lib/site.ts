import { z } from 'astro/zod';
import { parse } from 'yaml';
import profileRaw from '../data/profile.yaml?raw';
import settingsRaw from '../data/settings.yaml?raw';

const profileSchema = z.object({
  name: z.string(),
  givenName: z.string(),
  familyName: z.string(),
  role: z.string(),
  currentPosition: z.string(),
  affiliation: z.object({ name: z.string(), department: z.string(), url: z.string() }),
  location: z.string(),
  email: z.object({ user: z.string(), domain: z.string() }),
  positioning: z.string(),
  epigraph: z.object({ text: z.string(), attribution: z.string(), source: z.string() }),
  tagline: z.string(),
  heroStatement: z.string(),
  work: z.object({
    intro: z.string(),
    items: z.array(z.object({ title: z.string(), text: z.string() })),
  }),
  availability: z.string().optional(),
  industrySummary: z.string(),
  academicSummary: z.string(),
  bio: z.array(z.string()),
  sectors: z.array(z.string()),
  knowsAbout: z.array(z.string()),
  alumniOf: z.array(z.object({ name: z.string(), url: z.string().optional() })),
  links: z.array(z.object({ id: z.string(), label: z.string(), url: z.string().nullish() })),
  photographyUrl: z.string().nullish(),
  siteUrl: z.string(),
});

const settingsSchema = z.object({
  showDemos: z.boolean().default(false),
  showIndustry: z.boolean().default(false),
  showPhotographyLink: z.boolean().default(true),
  analytics: z.unknown().nullish(),
  home: z
    .object({ selectedPublications: z.number().default(3), selectedTalks: z.number().default(4) })
    .default({ selectedPublications: 3, selectedTalks: 4 }),
});

export const profile = profileSchema.parse(parse(profileRaw));
export const settings = settingsSchema.parse(parse(settingsRaw));

export const links = profile.links.filter((l): l is { id: string; label: string; url: string } => !!l.url);
export const photographyUrl =
  settings.showPhotographyLink && profile.photographyUrl ? profile.photographyUrl : null;
export const siteIsPlaceholder = profile.siteUrl.includes('USERNAME');

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/research/', label: 'Research' },
  { href: '/publications/', label: 'Publications' },
  { href: '/talks/', label: 'Talks' },
  { href: '/cv/', label: 'CV' },
  { href: '/about/', label: 'About' },
  ...(settings.showDemos ? [{ href: '/demos/', label: 'Demos' }] : []),
  ...(settings.showIndustry ? [{ href: '/industry/', label: 'For Industry' }] : []),
];

export const titleSuffix = `${profile.name} · Experimental physicist`;
