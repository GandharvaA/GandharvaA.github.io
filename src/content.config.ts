import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

// Keeps YAML order (as `order`) so lists render in the order they are written.
const ordered = (text: string) =>
  (parse(text) as Record<string, unknown>[]).map((entry, i) => ({ order: i, ...entry }));

const yamlFile = (name: string) => file(`src/data/${name}.yaml`, { parser: ordered });

const datePart = z.union([z.string(), z.number()]).transform(String);
const cvTarget = z.enum(['both', 'academic', 'industry', 'none']).default('both');
const base = { order: z.number(), hidden: z.boolean().default(false) };

const capabilities = defineCollection({
  loader: yamlFile('capabilities'),
  schema: z.object({
    ...base,
    icon: z.enum(['detector', 'calibration', 'signal', 'simulation', 'ai', 'compute']),
    title: z.string(),
    lab: z.string(),
    industry: z.string(),
  }),
});

const education = defineCollection({
  loader: yamlFile('education'),
  schema: z.object({
    ...base,
    degree: z.string(),
    field: z.string(),
    institution: z.string(),
    department: z.string().optional(),
    location: z.string().optional(),
    start: datePart,
    end: datePart,
    expected: z.boolean().default(false),
    thesis: z
      .object({ title: z.string(), advisor: z.string().optional(), url: z.string().optional() })
      .optional(),
    supervisors: z.array(z.string()).default([]),
    details: z.array(z.string()).default([]),
    cv: cvTarget,
  }),
});

const experience = defineCollection({
  loader: yamlFile('experience'),
  schema: z.object({
    ...base,
    title: z.string(),
    organisation: z.string(),
    location: z.string().optional(),
    start: datePart,
    end: datePart,
    category: z.enum(['research', 'industry', 'engineering', 'internship']),
    summary: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    advisors: z.string().optional(),
    skills: z.array(z.string()).default([]),
    cv: cvTarget,
  }),
});

const publications = defineCollection({
  loader: yamlFile('publications'),
  schema: z.object({
    ...base,
    type: z.enum(['article', 'proceedings', 'thesis', 'collaboration', 'report']),
    authors: z.array(z.string()),
    title: z.string(),
    venue: z.string(),
    year: z.number(),
    status: z.enum(['published', 'in-press', 'accepted', 'submitted', 'preprint', 'in-preparation']),
    doi: z.string().optional(),
    arxiv: z.string().optional(),
    url: z.string().optional(),
    selected: z.boolean().default(false),
    abstract: z.string().optional(),
    note: z.string().optional(),
  }),
});

const talks = defineCollection({
  loader: yamlFile('talks'),
  schema: z.object({
    ...base,
    date: z.string().regex(/^\d{4}(-\d{2}){0,2}$/),
    title: z.string(),
    type: z.enum(['invited', 'contributed', 'talk', 'poster', 'seminar', 'collaboration', 'outreach']),
    event: z.string(),
    location: z.string().optional(),
    slidesUrl: z.string().optional(),
    selected: z.boolean().default(false),
  }),
});

const teaching = defineCollection({
  loader: yamlFile('teaching'),
  schema: z.object({
    ...base,
    kind: z.enum(['course', 'supervision', 'training']),
    code: z.string().optional(),
    course: z.string(),
    role: z.string(),
    terms: z.array(datePart),
  }),
});

const service = defineCollection({
  loader: yamlFile('service'),
  schema: z.object({
    ...base,
    role: z.string(),
    organisation: z.string(),
    start: datePart,
    end: datePart,
    category: z.enum(['leadership', 'committee', 'lab', 'mentoring', 'outreach', 'student']),
    description: z.string().optional(),
    cv: cvTarget,
  }),
});

const skills = defineCollection({
  loader: yamlFile('skills'),
  schema: z.object({
    ...base,
    label: z.string(),
    items: z.array(
      z.object({
        name: z.string(),
        detail: z.string().optional(),
        level: z.enum(['expert', 'advanced', 'working', 'basic']).optional(),
        industry: z.boolean().default(false),
      }),
    ),
  }),
});

const grants = defineCollection({
  loader: yamlFile('grants'),
  schema: z.object({
    ...base,
    kind: z.enum(['grant', 'scholarship', 'award']),
    title: z.string(),
    issuer: z.string(),
    year: z.number(),
    purpose: z.string().optional(),
    cv: cvTarget,
  }),
});

const languages = defineCollection({
  loader: yamlFile('languages'),
  schema: z.object({ ...base, name: z.string(), level: z.string() }),
});

const training = defineCollection({
  loader: yamlFile('training'),
  schema: z.object({
    ...base,
    kind: z.enum(['school', 'workshop', 'experiment', 'visit']),
    title: z.string(),
    location: z.string().optional(),
    date: datePart,
  }),
});

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    kicker: z.string(),
    summary: z.string(),
    order: z.number(),
    period: z.string(),
    illustration: z.enum(['hades', 'cusp']),
    figureCaption: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  capabilities,
  education,
  experience,
  publications,
  talks,
  teaching,
  service,
  skills,
  grants,
  languages,
  training,
  research,
};
