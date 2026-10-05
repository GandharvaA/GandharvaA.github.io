#!/usr/bin/env node
// Builds public/cv/cv-industry.pdf (2 pages), public/cv/cv-industry-1p.pdf (1 page),
// and public/cv/cv-academic.pdf from src/data/*.yaml.
// Usage: node scripts/build-cv.mjs [--only industry|industry-onepage|academic]
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import YAML from 'yaml';
import {
  tex, href, texUrl, displayUrl, isPlaceholderUrl,
  formatDate, formatRange, dateKey, monthYear, fillTemplate,
} from './lib/cv-tex.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src/data');
const TEMPLATE_DIR = path.join(ROOT, 'cv/templates');
const BUILD_DIR = path.join(ROOT, 'cv/build');
const PUBLIC_DIR = path.join(ROOT, 'public/cv');
const OVERFULL_TOLERANCE_PT = 5;

const DOCS = {
  industry: { template: 'industry.tex', job: 'cv-industry', label: 'Industry CV (2 pages)', maxPages: 2 },
  'industry-onepage': {
    template: 'industry-onepage.tex',
    job: 'cv-industry-1p',
    label: 'Industry CV (1 page)',
    maxPages: 1,
  },
  academic: { template: 'academic.tex', job: 'cv-academic', label: 'Academic CV' },
};
const LISTS = ['capabilities', 'education', 'experience', 'publications', 'talks', 'teaching',
  'service', 'skills', 'grants', 'languages', 'training'];
const CV_VALUES = new Set(['both', 'academic', 'industry', 'none']);

const PUBLIC_TALK_TYPES = new Set(['invited', 'contributed', 'talk']);
const TALK_QUALIFIER = { invited: 'invited', contributed: 'contributed', poster: 'poster', seminar: 'seminar', outreach: 'outreach' };
const PUB_STATUS = { 'in-press': 'in press', accepted: 'accepted', submitted: 'submitted', preprint: 'preprint', 'in-preparation': 'in preparation' };
const PUB_GROUPS = [
  { label: 'Articles & proceedings', types: ['article', 'proceedings'] },
  { label: 'Collaboration papers & reports', types: ['collaboration', 'report'] },
  { label: 'Theses', types: ['thesis'] },
];
const TRAINING_GROUPS = [
  { label: 'Experiments & beam times', kinds: ['experiment'] },
  { label: 'Workshops & research visits', kinds: ['workshop', 'visit'] },
  { label: 'Schools & courses', kinds: ['school'] },
];

const warnings = [];
const warn = (msg) => warnings.push(msg);

// ------------------------------------------------------------------ data

async function loadData() {
  const read = async (name) => YAML.parse(await readFile(path.join(DATA_DIR, `${name}.yaml`), 'utf8'));
  const data = { profile: await read('profile'), settings: (await read('settings')) ?? {} };
  for (const name of LISTS) {
    const list = (await read(name)) ?? [];
    if (!Array.isArray(list)) throw new Error(`src/data/${name}.yaml must contain a list`);
    data[name] = list.filter((entry) => entry && entry.hidden !== true);
    for (const entry of data[name]) {
      if (entry.cv !== undefined && !CV_VALUES.has(entry.cv)) {
        warn(`${name}.yaml: "${entry.id}" has unknown cv value "${entry.cv}" (treated as excluded)`);
      }
    }
  }
  return data;
}

const inCv = (kind) => (entry) => {
  const cv = entry.cv ?? 'both';
  return cv === 'both' || cv === kind;
};

const byDateDesc = (get) => (a, b) => dateKey(get(b)) - dateKey(get(a));
const city = (location) => String(location ?? '').split(',')[0].trim();
const ensurePeriod = (s) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const join = (items, sep = '\\cvsep ') => items.filter(Boolean).join(sep);
// Narrow date columns may wrap a range, but never between month and year.
const texDate = (s) => tex(String(s ?? '').replace(/\b([A-Z][a-z]{2}) (\d{4})\b/g, '$1\u00A0$2'));

// Collision energies and similar physics numbers stay out of the industry CV.
const industryText = (s) => String(s ?? '').replace(/\s*\([^()]*(?:√s|[GMT]eV)[^()]*\)/g, '');

function ownName(profile) {
  return `${profile.givenName?.[0] ?? ''}. ${profile.familyName ?? ''}`.trim();
}

// ------------------------------------------------------------------ shared blocks

function renderHeader(profile) {
  const email = `${profile.email.user}@${profile.email.domain}`;
  const lines = [];
  if (profile.location) lines.push(tex(city(profile.location)));
  lines.push(`\\href{mailto:${texUrl(email)}}{${tex(email)}}`);
  if (!isPlaceholderUrl(profile.siteUrl)) lines.push(href(profile.siteUrl, displayUrl(profile.siteUrl)));
  const links = (profile.links ?? []).filter((l) => !isPlaceholderUrl(l.url));
  if (links.length) lines.push(join(links.map((l) => href(l.url, l.label))));
  const position = [profile.currentPosition, profile.affiliation?.name].filter(Boolean).join(', ');
  return `\\cvheader{${tex(profile.name)}}{${tex(profile.role)}}{${tex(position)}}{${lines.join('\\\\\n')}}`;
}

function formatAuthors(authors, me) {
  const list = [...(authors ?? [])];
  if (list.length > 1 && /^et al\.?$/.test(list.at(-1)) && list.at(-2) === '…') list.splice(-2, 1);
  return list
    .map((a) => {
      const i = a.indexOf(me);
      const raw = { trim: false };
      const s = i < 0 ? tex(a) : `${tex(a.slice(0, i), raw)}\\textbf{${tex(me)}}${tex(a.slice(i + me.length), raw)}`;
      return s.replace(/([A-Z]\.) (?=[A-Z])/g, '$1~');
    })
    .join(', ')
    .replace(/(\S) \\textbf/g, '$1~\\textbf');
}

function pubLink(p) {
  if (p.url) return p.url;
  if (p.doi) return `https://doi.org/${p.doi}`;
  if (p.arxiv) return `https://arxiv.org/abs/${p.arxiv}`;
  return '';
}

function formatPublication(p, me, { withYear = true } = {}) {
  const link = pubLink(p);
  const title = link ? `\\href{${texUrl(link)}}{“${tex(p.title)}”}` : `“${tex(p.title)}”`;
  const showVenue = p.venue && !(p.venue === 'Manuscript' && p.status === 'in-preparation');
  const venue = showVenue ? `\\textit{${tex(p.venue).replace(/\[[^\]\s]{1,20}\]/g, '\\mbox{$&}')}}` : '';
  const links = [];
  if (p.doi) links.push(`\\href{${texUrl(`https://doi.org/${p.doi}`)}}{doi:${tex(p.doi)}}`);
  if (p.arxiv && !String(p.venue ?? '').includes(p.arxiv)) links.push(`\\href{${texUrl(`https://arxiv.org/abs/${p.arxiv}`)}}{arXiv:${tex(p.arxiv)}}`);
  const year = withYear && p.year ? `(${tex(p.year)})` : '';
  const withYearSuffix = (s) => (year ? `${s} ${year}` : s);
  const text = [formatAuthors(p.authors, me), venue ? title : withYearSuffix(title), venue && withYearSuffix(venue), ...links]
    .filter(Boolean).join(', ');
  const status = PUB_STATUS[p.status] ? `\\cvtag{${PUB_STATUS[p.status]}}` : '';
  return `${text}.${status}`;
}

const pubStatusRank = (p) => (p.status === 'in-preparation' ? 1 : 0);
const sortPublications = (list) =>
  [...list].sort((a, b) => pubStatusRank(a) - pubStatusRank(b) || Number(b.year ?? 0) - Number(a.year ?? 0));

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'for', 'in', 'on', 'to', 'with', 'at', 'by', 'from']);
const contentWords = (s) => String(s ?? '').toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter((w) => !STOPWORDS.has(w))
  .map((w) => w.replace(/s$/, '')) ?? [];

// A summary whose content words all reappear in the highlights adds nothing.
function summaryIsRedundant(e) {
  if (!e.summary || !e.highlights?.length) return false;
  const pool = new Set(contentWords(e.highlights.join(' ')));
  return contentWords(e.summary).every((w) => pool.has(w));
}

function experienceEntry(e, kind, { tools = true } = {}) {
  const text = kind === 'industry' ? industryText : (s) => s;
  const out = [`\\cventry{${tex(e.title)}}{${tex(e.organisation)}}{${texDate(formatRange(e.start, e.end))}}{${tex(e.location)}}`];
  if (e.summary && !summaryIsRedundant(e)) out.push(`${tex(text(e.summary))}\\par`);
  if (e.highlights?.length) {
    out.push('\\begin{cvitems}', ...e.highlights.map((h) => `\\item ${tex(text(h))}`), '\\end{cvitems}');
  }
  if (kind === 'academic' && e.advisors) out.push(`\\cvnote{Supervision: ${tex(e.advisors)}}\\par`);
  if (tools && e.skills?.length) out.push(`\\cvtools{${join(e.skills.map(tex))}}`);
  return out.join('\n');
}

function compactExperience(e) {
  const where = [e.organisation, city(e.location)].filter(Boolean).map(tex).join(', ');
  const summary = e.summary ? ` ${tex(ensurePeriod(e.summary))}` : '';
  return `\\cvitem{${texDate(formatRange(e.start, e.end))}}{\\textbf{${tex(e.title)}}, ${where}.${summary}}`;
}

function serviceGroups(list) {
  const groups = new Map();
  for (const s of list) {
    const key = s.organisation ?? s.role;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.entries()].map(([organisation, items]) => {
    const starts = items.map((i) => i.start).filter(Boolean).sort((a, b) => dateKey(a) - dateKey(b));
    const ends = items.map((i) => i.end ?? i.start).filter(Boolean).sort((a, b) => dateKey(a) - dateKey(b));
    return { organisation, items, start: starts[0], end: ends.at(-1) };
  });
}

function renderService(list, { describe = () => true } = {}) {
  return serviceGroups(list)
    .map(({ organisation, items, start, end }) => {
      const roles = items.length === 1
        ? `\\textbf{${tex(items[0].role)}}`
        : items.map((i) => `\\textbf{${tex(i.role)}} {\\small(${texDate(formatRange(i.start, i.end, { yearOnly: true }))})}`).join(', ');
      const desc = items.filter(describe).map((i) => i.description).filter(Boolean)
        .map((d) => tex(ensurePeriod(d))).join(' ');
      return `\\cvitem{${texDate(formatRange(start, end, { yearOnly: true }))}}{${roles}, ${tex(organisation)}.${desc ? ` ${desc}` : ''}}`;
    })
    .join('\n');
}

function skillText(item) {
  return item.detail ? `${tex(item.name)} {\\color{cvmuted}(${tex(item.detail)})}` : tex(item.name);
}

function termYears(terms) {
  const years = (terms ?? []).map((t) => /(\d{4})/.exec(String(t))?.[1]).filter(Boolean).map(Number);
  if (!years.length) return '';
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}

function shortEvent(event) {
  return String(event).split(/ — |: |, /)[0].trim();
}

function collaborationNames(talks) {
  const counts = new Map();
  for (const t of talks) {
    for (const m of new Set(String(t.event).match(/\b[A-Z]{3,}\b/g) ?? [])) {
      if (!/^[IVXLCDM]+$/.test(m)) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
  }
  return [...counts.entries()].filter(([, c]) => c >= 1).sort((a, b) => b[1] - a[1]).map(([n]) => n);
}

function listAnd(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function pdfMeta(profile, kind) {
  return {
    NAME: tex(profile.name),
    PDF_TITLE: tex(`${profile.name}, ${kind === 'industry' ? 'CV' : 'Academic CV'}`),
    PDF_SUBJECT: tex(profile.role),
    PDF_KEYWORDS: tex((profile.knowsAbout ?? []).join(', ')),
    UPDATED: tex(monthYear()),
    HEADER: renderHeader(profile),
  };
}

// ------------------------------------------------------------------ industry CV

function renderIndustry(d) {
  const { profile } = d;
  const me = ownName(profile);
  const v = pdfMeta(profile, 'industry');

  const outlook = [
    profile.availability ? `{\\itshape ${tex(ensurePeriod(profile.availability))}}` : '',
    profile.sectors?.length ? `{\\cvmeta Sectors of interest:}\\enspace{\\small ${join(profile.sectors.map(tex))}}` : '',
  ].filter(Boolean).join('\\enspace ');
  v.PROFILE = [
    `\\cvprose{${tex(industryText(profile.industrySummary))}}`,
    outlook ? `\\vspace{2.5pt}\\noindent ${outlook}\\par` : '',
  ].filter(Boolean).join('\n');

  const caps = d.capabilities.filter(inCv('industry'));
  const capCell = (c) => (c ? [tex(c.title), tex(c.industry)] : ['', '']);
  const capRows = [];
  for (let i = 0; i < caps.length; i += 2) {
    capRows.push(`\\cvcaprow${[...capCell(caps[i]), ...capCell(caps[i + 1])].map((x) => `{${x}}`).join('')}`);
  }
  v.CAPABILITIES = capRows.join('\n');

  const exp = d.experience.filter(inCv('industry'));
  const full = exp.filter((e) => e.highlights?.length);
  const compact = exp.filter((e) => !e.highlights?.length);
  v.EXPERIENCE = [
    ...full.map((e) => experienceEntry(e, 'industry')),
    compact.length ? '\\cvsubsection{Earlier projects \\& internships}' : '',
    ...compact.map(compactExperience),
  ].filter(Boolean).join('\n\n');

  const education = d.education.filter(inCv('industry'));
  const latestCompleted = education.filter((e) => !e.expected).sort(byDateDesc((e) => e.end))[0];
  v.EDUCATION = education.map((e) => {
    const line = `\\cvitem{${texDate(formatRange(e.start, e.end, { expected: e.expected, yearOnly: true }))}}{\\textbf{${tex(e.degree)}}, ${tex(e.field)}\\cvsep\\textit{${tex(e.institution)}}}`;
    const thesisLabel = e.degree === 'MSc' ? "Master's thesis" : 'Thesis';
    const thesis = e === latestCompleted && e.thesis?.title ? `\\cvnote{${thesisLabel}: “${tex(e.thesis.title)}”}\\par` : '';
    return [line, thesis].filter(Boolean).join('\n');
  }).join('\n');

  v.SKILLS = d.skills
    .map((g) => ({ ...g, items: (g.items ?? []).filter((i) => i.industry === true && i.hidden !== true) }))
    .filter((g) => g.items.length)
    .map((g) => `\\cvrow{${tex(g.label)}}{${join(g.items.map(skillText))}}`)
    .join('\n');

  const shownThesis = latestCompleted?.thesis?.title?.trim();
  const pubs = sortPublications(d.publications.filter(inCv('industry'))
    .filter((p) => p.selected && !(p.type === 'thesis' && p.title?.trim() === shownThesis)));
  const talks = d.talks.filter(inCv('industry'));
  const publicTalks = talks.filter((t) => PUBLIC_TALK_TYPES.has(t.type)).sort(byDateDesc((t) => t.date));
  const collabTalks = talks.filter((t) => t.type === 'collaboration');
  const selectedTalks = publicTalks.filter((t) => t.selected);
  const ptItems = [];
  for (const p of pubs) ptItems.push(`\\cvitem{${tex(p.year)}}{${formatPublication(p, me, { withYear: false })}}`);
  if (publicTalks.length) {
    const named = selectedTalks.map((t) => {
      const ev = shortEvent(t.event);
      const year = String(t.date).slice(0, 4);
      return `${tex(ev)} (${tex(city(t.location))}${ev.includes(year) ? '' : `, ${year}`})`;
    });
    const years = publicTalks.map((t) => String(t.date).slice(0, 4)).sort();
    const range = years[0] === years.at(-1) ? years[0] : `${years[0]}–${years.at(-1)}`;
    let text = `\\textbf{${publicTalks.length} conference talks}${named.length ? `, including ${listAnd(named)}` : ''}`;
    if (collabTalks.length) {
      const names = collaborationNames(collabTalks);
      text += `; plus ${collabTalks.length} presentations at internal ${names.length ? `${listAnd(names.map(tex))} ` : ''}collaboration meetings`;
    }
    ptItems.push(`\\cvitem{${range}}{${text}.}`);
  }
  v.PUBLICATIONS_TALKS = ptItems.join('\n');

  const industryService = d.service.filter(inCv('industry'));
  v.LABORATORY = renderService(industryService.filter((s) => s.category === 'lab'));
  const leadership = [renderService(industryService.filter((s) => s.category !== 'lab'), { describe: () => false })];
  const courses = d.teaching.filter(inCv('industry')).filter((t) => t.kind === 'course');
  const supervision = d.teaching.filter(inCv('industry')).filter((t) => t.kind === 'supervision');
  if (courses.length) {
    const years = termYears([...courses, ...supervision].flatMap((t) => t.terms ?? []));
    const sup = supervision.length ? `; co-supervision of ${listAnd(supervision.map((s) => `a ${tex(s.course)}`))}` : '';
    const where = profile.affiliation?.name ? `, ${tex(profile.affiliation.name)}` : '';
    leadership.push(`\\cvitem{${years}}{\\textbf{University teaching}${where}. Laboratory courses and classroom teaching, including lectures, tutorials and problem solving, in ${courses.length} physics courses${sup}.}`);
  }
  v.LEADERSHIP = leadership.filter(Boolean).join('\n');

  const grants = d.grants.filter(inCv('industry'));
  const awards = grants.filter((g) => g.kind === 'award').sort(byDateDesc((g) => String(g.year)));
  const funding = grants.filter((g) => g.kind !== 'award');
  const rows = [];
  if (awards.length) {
    rows.push(`\\cvrow{Awards}{${join(awards.map((a) => `${tex(a.title)}${String(a.title).includes(String(a.year)) ? '' : ` (${tex(a.year)})`}`))}}`);
  }
  if (funding.length) {
    const years = funding.map((g) => Number(g.year)).filter(Boolean);
    const issuers = [...new Set(funding.map((g) => String(g.issuer).split(',').at(-1).trim()))];
    const range = Math.min(...years) === Math.max(...years) ? `${years[0]}` : `${Math.min(...years)}–${Math.max(...years)}`;
    rows.push(`\\cvrow{Grants}{${funding.length} grants and scholarships for research travel and experiments (${tex(listAnd(issuers))}, ${range})}`);
  }
  if (d.languages.length) rows.push(`\\cvrow{Languages}{${join(d.languages.map((l) => `${tex(l.name)}: ${tex(l.level)}`))}}`);
  v.AWARDS_LANGUAGES = rows.join('\n');

  return v;
}

// ------------------------------------------------------------------ industry CV (1 page)

function renderIndustryOnePage(d) {
  const { profile } = d;
  const me = ownName(profile);
  const v = pdfMeta(profile, 'industry');
  v.PDF_TITLE = tex(`${profile.name}, CV (1 page)`);

  v.PROFILE = `\\cvprose{${tex(industryText(profile.industrySummary))}}`;

  // Dense PhD bullets for the 1-page layout; full wording stays on the 2-page CV.
  const phdShort = [
    'ΛΛ analysis in PANDA@HADES: reconstruction, PID, fits and systematics.',
    'Detector shifts (2022 proton and 2025 pion beam times); drift-chamber QA.',
    'Relative time-of-flight PID for start-detector timing issues.',
    'Multiclass ML classifiers (ROOT TMVA) for signal–background separation.',
    'Automated analysis pipeline on the GSI batch farm (Slurm / HPC), with LLMs.',
    'Event generator and detector-response folding for CBM ΞN-cusp studies.',
  ];

  const exp = d.experience.filter(inCv('industry'));
  const phd = exp.find((e) => e.id === 'phd-su');
  const other = exp.filter((e) => e.id !== 'phd-su');
  const phdBlock = phd
    ? [
      `\\cventry{${tex(phd.title)}}{${tex(phd.organisation)}}{${texDate(formatRange(phd.start, phd.end))}}{${tex(phd.location)}}`,
      `${tex(industryText(phd.summary))}\\par`,
      '\\begin{cvitems}',
      ...phdShort.map((h) => `\\item ${tex(h)}`),
      '\\end{cvitems}',
    ].join('\n')
    : '';
  v.EXPERIENCE = [
    phdBlock,
    other.length ? '\\cvsubsection{Earlier experience}' : '',
    ...other.map(compactExperience),
  ].filter(Boolean).join('\n\n');

  const education = d.education.filter(inCv('industry'));
  const latestCompleted = education.filter((e) => !e.expected).sort(byDateDesc((e) => e.end))[0];
  v.EDUCATION = education.map((e) => {
    const line = `\\cvitem{${texDate(formatRange(e.start, e.end, { expected: e.expected, yearOnly: true }))}}{\\textbf{${tex(e.degree)}}, ${tex(e.field)}\\cvsep\\textit{${tex(e.institution)}}}`;
    const thesisLabel = e.degree === 'MSc' ? "Master's thesis" : 'Thesis';
    const thesis = e === latestCompleted && e.thesis?.title ? `\\cvnote{${thesisLabel}: “${tex(e.thesis.title)}”}\\par` : '';
    return [line, thesis].filter(Boolean).join('\n');
  }).join('\n');

  v.SKILLS = d.skills
    .map((g) => ({ ...g, items: (g.items ?? []).filter((i) => i.industry === true && i.hidden !== true) }))
    .filter((g) => g.items.length)
    .map((g) => `\\cvrow{${tex(g.label)}}{${join(g.items.map((i) => tex(i.name)))}}`)
    .join('\n');

  const shownThesis = latestCompleted?.thesis?.title?.trim();
  const pubs = sortPublications(d.publications.filter(inCv('industry'))
    .filter((p) => p.selected && !(p.type === 'thesis' && p.title?.trim() === shownThesis)));
  const talks = d.talks.filter(inCv('industry'));
  const publicTalks = talks.filter((t) => PUBLIC_TALK_TYPES.has(t.type)).sort(byDateDesc((t) => t.date));
  const selectedTalks = publicTalks.filter((t) => t.selected);
  const ptItems = pubs.map((p) => {
    const link = pubLink(p);
    const title = link ? `\\href{${texUrl(link)}}{“${tex(p.title)}”}` : `“${tex(p.title)}”`;
    const status = PUB_STATUS[p.status] ? `\\cvtag{${PUB_STATUS[p.status]}}` : '';
    return `\\cvitem{${tex(p.year)}}{${title}.${status}}`;
  });
  if (publicTalks.length) {
    const named = selectedTalks.slice(0, 3).map((t) => {
      const ev = shortEvent(t.event);
      const year = String(t.date).slice(0, 4);
      return `${tex(ev)} (${year})`;
    });
    const years = publicTalks.map((t) => String(t.date).slice(0, 4)).sort();
    const range = years[0] === years.at(-1) ? years[0] : `${years[0]}–${years.at(-1)}`;
    ptItems.push(`\\cvitem{${range}}{\\textbf{${publicTalks.length} conference talks}${named.length ? `, including ${listAnd(named)}` : ''}.}`);
  }
  v.PUBLICATIONS_TALKS = ptItems.join('\n');

  const industryService = d.service.filter(inCv('industry'));
  const lab = industryService.filter((s) => s.category === 'lab');
  const lead = industryService.filter((s) => s.category !== 'lab');
  const courses = d.teaching.filter(inCv('industry')).filter((t) => t.kind === 'course' || t.kind === 'supervision');

  // One dense section: each role and course stays its own line.
  const serviceLines = [
    ...lab.map((s) => `\\cvitem{${texDate(formatRange(s.start, s.end, { yearOnly: true }))}}{\\textbf{${tex(s.role)}}, ${tex(s.organisation)}.}`),
    ...lead.map((s) => `\\cvitem{${texDate(formatRange(s.start, s.end, { yearOnly: true }))}}{\\textbf{${tex(s.role)}}, ${tex(s.organisation)}.}`),
    ...courses.map((t) => {
      const code = t.code ? ` (${tex(t.code)})` : '';
      const role = String(t.role ?? '').split(':')[0].trim();
      return `\\cvitem{${termYears(t.terms)}}{\\textbf{${tex(t.course)}}${code}\\cvsep ${tex(role)}}`;
    }),
  ];
  v.LABORATORY = '';
  v.TEACHING = '';
  v.LEADERSHIP = serviceLines.join('\n');

  const grants = d.grants.filter(inCv('industry'));
  const awards = grants.filter((g) => g.kind === 'award').sort(byDateDesc((g) => String(g.year)));
  const funding = grants.filter((g) => g.kind !== 'award');
  const rows = [];
  if (awards.length || funding.length) {
    const bits = [];
    if (awards.length) bits.push(awards.map((a) => `${tex(a.title)} (${tex(a.year)})`).join('; '));
    if (funding.length) {
      const years = funding.map((g) => Number(g.year)).filter(Boolean);
      const range = Math.min(...years) === Math.max(...years) ? `${years[0]}` : `${Math.min(...years)}–${Math.max(...years)}`;
      bits.push(`${funding.length} travel and research grants (${range})`);
    }
    rows.push(`\\cvrow{Awards \\& grants}{${bits.join('; ')}}`);
  }
  if (d.languages.length) rows.push(`\\cvrow{Languages}{${join(d.languages.map((l) => `${tex(l.name)}: ${tex(l.level)}`))}}`);
  v.AWARDS_LANGUAGES = rows.join('\n');

  return v;
}

// ------------------------------------------------------------------ academic CV

function renderAcademic(d) {
  const { profile } = d;
  const me = ownName(profile);
  const v = pdfMeta(profile, 'academic');
  const keep = inCv('academic');

  v.PROFILE = `\\cvprose{${tex(profile.academicSummary)}}`;

  v.EDUCATION = d.education.filter(keep).map((e) => {
    const org = [e.institution, e.department].filter(Boolean).map(tex).join(', ');
    const out = [`\\cventry{${tex(e.degree)}, ${tex(e.field)}}{${org}}{${texDate(formatRange(e.start, e.end, { expected: e.expected, yearOnly: true }))}}{${tex(e.location)}}`];
    if (e.thesis?.title) out.push(`${e.degree === 'MSc' ? "Master's thesis" : 'Thesis'}: “${tex(e.thesis.title)}”\\par`);
    const notes = [];
    if (e.supervisors?.length) notes.push(`Supervisors: ${e.supervisors.map(tex).join('; ')}.`);
    if (e.thesis?.advisor && !e.supervisors?.length) notes.push(`Thesis advisor: ${tex(e.thesis.advisor)}.`);
    for (const detail of e.details ?? []) notes.push(tex(ensurePeriod(detail)));
    if (notes.length) out.push(`\\cvnote{${notes.join(' ')}}\\par`);
    return out.join('\n');
  }).join('\n\n');

  const exp = d.experience.filter(keep);
  v.RESEARCH = exp.filter((e) => e.category === 'research').map((e) => experienceEntry(e, 'academic')).join('\n\n');
  v.ENGINEERING = exp.filter((e) => e.category !== 'research').map((e) => experienceEntry(e, 'academic')).join('\n\n');

  const pubs = d.publications.filter(keep);
  const groups = PUB_GROUPS.map((g) => ({ ...g, items: sortPublications(pubs.filter((p) => g.types.includes(p.type))) }));
  const other = sortPublications(pubs.filter((p) => !PUB_GROUPS.some((g) => g.types.includes(p.type))));
  if (other.length) groups.push({ label: 'Other', items: other });
  const nonEmpty = groups.filter((g) => g.items.length);
  let n = 0;
  v.PUBLICATIONS = nonEmpty.map((g) => [
    nonEmpty.length > 1 ? `\\cvsubsection{${tex(g.label)}}` : '',
    ...g.items.map((p) => {
      n += 1;
      const note = p.note ? `\\newline\\cvnote{${tex(p.note)}}` : '';
      return `\\cvnumbered{[${n}]}{${formatPublication(p, me)}${note}}`;
    }),
  ].filter(Boolean).join('\n')).join('\n');

  const talks = d.talks.filter(keep).sort(byDateDesc((t) => t.date));
  v.TALKS = talks.filter((t) => t.type !== 'collaboration').map((t) => {
    const q = TALK_QUALIFIER[t.type] ? `\\cvtag{${TALK_QUALIFIER[t.type]}}` : '';
    return `\\cvitem{${texDate(formatDate(t.date))}}{“${tex(t.title)}”\\newline{\\small\\itshape ${tex(t.event)}}{\\small, ${tex(t.location)}}${q}}`;
  }).join('\n');
  const collab = talks.filter((t) => t.type === 'collaboration');
  v.COLLAB_TALKS = collab.length
    ? `{\\small\n${collab.map((t) => {
      const loc = /^online$/i.test(t.location ?? '') ? 'online' : tex(t.location);
      return `\\cvitem{${texDate(formatDate(t.date))}}{${tex(t.title)}\\cvsep\\textit{${tex(t.event)}}${loc ? `, ${loc}` : ''}}`;
    }).join('\n')}\\par}`
    : '';

  const training = d.training.filter(keep);
  const tGroups = TRAINING_GROUPS.map((g) => ({ ...g, items: training.filter((t) => g.kinds.includes(t.kind)) }));
  const tOther = training.filter((t) => !TRAINING_GROUPS.some((g) => g.kinds.includes(t.kind)));
  if (tOther.length) tGroups.push({ label: 'Other', items: tOther });
  v.TRAINING = tGroups.filter((g) => g.items.length).map((g) => [
    `\\cvsubsection{${tex(g.label)}}`,
    ...[...g.items].sort(byDateDesc((t) => t.date)).map((t) => `\\cvitem{${texDate(formatDate(t.date))}}{${tex(t.title)}\\cvsep{\\small ${tex(t.location)}}}`),
  ].join('\n')).join('\n');

  const teaching = d.teaching.filter(keep);
  const teachGroups = [
    { label: 'Courses', kind: 'course' },
    { label: 'Supervision', kind: 'supervision' },
    { label: 'Pedagogical training', kind: 'training' },
  ];
  v.TEACHING = teachGroups.map((g) => {
    const items = teaching.filter((t) => t.kind === g.kind);
    if (!items.length) return '';
    return [`\\cvsubsection{${g.label}}`, ...items.map((t) => {
      const terms = (t.terms ?? []).map(String).filter((x) => !/^\d{4}$/.test(x));
      const head = `\\textbf{${tex(t.course)}}${t.code ? `, ${tex(t.code)}` : ''}${terms.length ? `\\cvsep{\\cvmeta ${tex(terms.join(', '))}}` : ''}`;
      return `\\cvitem{${termYears(t.terms)}}{${head}\\newline ${tex(t.role)}}`;
    })].join('\n');
  }).filter(Boolean).join('\n');

  const academicService = d.service.filter(keep);
  v.LABORATORY = renderService(academicService.filter((s) => s.category === 'lab'));
  v.SERVICE = renderService(academicService.filter((s) => s.category !== 'lab'));

  const grants = d.grants.filter(keep);
  const grantItem = (g) => {
    const purpose = g.purpose ? ` ${tex(ensurePeriod(g.purpose))}` : '';
    return `\\cvitem{${tex(g.year)}}{\\textbf{${tex(g.title)}}, ${tex(g.issuer)}.${purpose}}`;
  };
  const funding = grants.filter((g) => g.kind !== 'award').sort(byDateDesc((g) => String(g.year)));
  const awards = grants.filter((g) => g.kind === 'award').sort(byDateDesc((g) => String(g.year)));
  v.GRANTS = [
    funding.length ? ['\\cvsubsection{Grants \\& scholarships}', ...funding.map(grantItem)].join('\n') : '',
    awards.length ? ['\\cvsubsection{Awards}', ...awards.map(grantItem)].join('\n') : '',
  ].filter(Boolean).join('\n');

  v.SKILLS = d.skills
    .map((g) => ({ ...g, items: (g.items ?? []).filter((i) => i.hidden !== true) }))
    .filter((g) => g.items.length)
    .map((g) => `\\cvrow{${tex(g.label)}}{${join(g.items.map(skillText))}}`)
    .join('\n');

  v.LANGUAGES = d.languages.map((l) => `\\cvrow{${tex(l.name)}}{${tex(l.level)}}`).join('\n');
  return v;
}

// ------------------------------------------------------------------ privacy guard

const FORBIDDEN = [
  [/\b(C?GPA|grade point|date of birth|born on|citizenship|nationality|passport|personnummer)\b/i, 'personal data or grades'],
  [/\+\d{1,3}[\s-]?\(?\d[\d\s()-]{6,}\d/, 'phone number'],
  [/\b\d[\d\s.,]*\s?(SEK|kr|EUR|USD|INR|€)\b|\\\$\s?\d/, 'monetary amount'],
];

function privacyCheck(name, texSource) {
  const body = texSource.split('\\begin{document}')[1] ?? texSource;
  const hits = FORBIDDEN.filter(([re]) => re.test(body)).map(([re, what]) => `${what} (${body.match(re)[0]})`);
  if (hits.length) throw new Error(`${name}: refusing to build, found ${hits.join('; ')}`);
}

// ------------------------------------------------------------------ toolchain

function findExecutable(candidates) {
  for (const c of candidates.filter(Boolean)) {
    if (c.includes('/')) {
      if (existsSync(c)) return c;
    } else {
      for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
        const p = path.join(dir, c);
        if (dir && existsSync(p)) return p;
      }
    }
  }
  return null;
}

const XELATEX = findExecutable([process.env.XELATEX, '/Library/TeX/texbin/xelatex', 'xelatex']);
const GS = findExecutable([process.env.GS, 'gs', '/usr/local/bin/gs', '/opt/homebrew/bin/gs']);

function readIfExists(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

function compile(job) {
  const env = {
    ...process.env,
    // XeLaTeX shells out to sibling binaries (kpsewhich, xdvipdfmx).
    PATH: [path.dirname(XELATEX), process.env.PATH].filter(Boolean).join(path.delimiter),
    TEXINPUTS: `${TEMPLATE_DIR}${path.delimiter}`,
    max_print_line: '10000',
  };
  const aux = path.join(BUILD_DIR, `${job}.aux`);
  for (let pass = 1; pass <= 3; pass++) {
    const before = readIfExists(aux);
    const r = spawnSync(XELATEX, ['-interaction=nonstopmode', '-halt-on-error', '-file-line-error', `${job}.tex`], {
      cwd: BUILD_DIR, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    if (r.error) throw r.error;
    if (r.status !== 0) {
      const log = readIfExists(path.join(BUILD_DIR, `${job}.log`)) ?? r.stdout;
      const errors = log.split('\n').filter((l) => /^(!|.*:\d+: )/.test(l)).slice(0, 15);
      throw new Error(`xelatex failed for ${job}.tex (pass ${pass}):\n${errors.join('\n') || log.slice(-3000)}`);
    }
    if (pass > 1 && before === readIfExists(aux)) return pass;
    if (pass === 1 && before !== null && before === readIfExists(aux)) return pass;
  }
  return 3;
}

function analyseLog(job) {
  const log = readIfExists(path.join(BUILD_DIR, `${job}.log`)) ?? '';
  const missing = [...log.matchAll(/Missing character: There is no (.+?) in font (.+?)!/g)].map((m) => `${m[1]} in ${m[2]}`);
  const overfull = [...log.matchAll(/Overfull \\[hv]box \(([\d.]+)pt too (?:wide|high)\)[^\n]*(?:lines? (\d+)(?:--(\d+))?)?/g)]
    .map((m) => ({ pt: Number(m[1]), text: m[0] }));
  const pages = Number(/Output written on .*?\((\d+) pages?/.exec(log)?.[1] ?? NaN);
  return { missing, overfull, pages };
}

function pageCount(pdf, fallback) {
  if (GS) {
    const ps = pdf.replace(/[\\()]/g, '\\$&');
    const r = spawnSync(GS, ['-q', '-dNODISPLAY', '-dNOSAFER', '-c', `(${ps}) (r) file runpdfbegin pdfpagecount = quit`], { encoding: 'utf8' });
    const n = Number.parseInt(String(r.stdout).trim(), 10);
    if (r.status === 0 && Number.isInteger(n)) return { pages: n, source: 'ghostscript' };
  }
  return { pages: fallback, source: 'xelatex log' };
}

// ------------------------------------------------------------------ main

async function main() {
  const { values } = parseArgs({ options: { only: { type: 'string' } } });
  if (values.only && !DOCS[values.only]) {
    throw new Error(`--only must be one of: ${Object.keys(DOCS).join(', ')}`);
  }
  if (!XELATEX) throw new Error('xelatex not found (set XELATEX=/path/to/xelatex)');
  if (!GS) warn('ghostscript (gs) not found; page counts are read from the xelatex log');

  const data = await loadData();
  await mkdir(BUILD_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  const renderers = {
    industry: renderIndustry,
    'industry-onepage': renderIndustryOnePage,
    academic: renderAcademic,
  };
  const results = [];
  let failed = false;

  for (const kind of values.only ? [values.only] : Object.keys(DOCS)) {
    const doc = DOCS[kind];
    const template = await readFile(path.join(TEMPLATE_DIR, doc.template), 'utf8');
    const source = fillTemplate(template, renderers[kind](data), doc.template);
    privacyCheck(doc.template, source);
    await writeFile(path.join(BUILD_DIR, `${doc.job}.tex`), source);

    const t0 = Date.now();
    const passes = compile(doc.job);
    const pdf = path.join(BUILD_DIR, `${doc.job}.pdf`);
    const log = analyseLog(doc.job);
    const { pages, source: pageSource } = pageCount(pdf, log.pages);
    const big = log.overfull.filter((o) => o.pt > OVERFULL_TOLERANCE_PT);
    const problems = [];
    if (log.missing.length) problems.push(`${log.missing.length} missing glyph(s): ${[...new Set(log.missing)].join('; ')}`);
    if (doc.maxPages && pages > doc.maxPages) problems.push(`${pages} pages (limit ${doc.maxPages})`);
    for (const o of big) warn(`${doc.job}: ${o.text}`);

    if (problems.length) {
      failed = true;
      console.error(`✗ ${doc.label}: ${problems.join('; ')}. Not copied (see cv/build/${doc.job}.log)`);
    } else {
      await copyFile(pdf, path.join(PUBLIC_DIR, `${doc.job}.pdf`));
    }
    results.push({ doc, pages, pageSource, passes, overfull: log.overfull, missing: log.missing.length, ms: Date.now() - t0, ok: !problems.length });
  }

  for (const w of warnings) console.warn(`warning: ${w}`);
  console.log('\nCV build summary');
  for (const r of results) {
    const maxOver = r.overfull.length ? `, ${r.overfull.length} overfull box(es), max ${Math.max(...r.overfull.map((o) => o.pt)).toFixed(1)}pt` : '';
    console.log(`  ${r.ok ? '✓' : '✗'} ${`public/cv/${r.doc.job}.pdf`.padEnd(26)} ${String(r.pages).padStart(2)} page(s) [${r.pageSource}]`
      + `  missing glyphs: ${r.missing}${maxOver}  (${r.passes} xelatex pass${r.passes > 1 ? 'es' : ''}, ${(r.ms / 1000).toFixed(1)}s)`);
  }
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`build-cv: ${err.message}`);
  process.exitCode = 1;
});
