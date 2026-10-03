import { getCollection, type CollectionEntry, type DataCollectionKey } from 'astro:content';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(value: string): string {
  const [y, m, d] = value.split('-');
  if (!m) return y;
  const month = MONTHS[Number(m) - 1] ?? m;
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
}

export function formatRange(start: string, end: string, expected = false): string {
  const s = formatDate(start);
  if (end === 'present') return `${s} – present`;
  const e = formatDate(end) + (expected ? ' (expected)' : '');
  return s === e ? s : `${s} – ${e}`;
}

export function yearRange(start: string, end: string): string {
  const s = start.slice(0, 4);
  const e = end === 'present' ? 'present' : end.slice(0, 4);
  return s === e ? s : `${s}–${e}`;
}

type Visible = { data: { hidden: boolean; order: number } };

export async function visible<C extends DataCollectionKey>(name: C): Promise<CollectionEntry<C>[]> {
  const entries = (await getCollection(name)) as unknown as (CollectionEntry<C> & Visible)[];
  return entries.filter((e) => !e.data.hidden).sort((a, b) => a.data.order - b.data.order);
}

export async function getTalks() {
  const talks = (await visible('talks')).sort((a, b) => b.data.date.localeCompare(a.data.date));
  return {
    all: talks,
    conference: talks.filter((t) => t.data.type !== 'collaboration'),
    collaboration: talks.filter((t) => t.data.type === 'collaboration'),
  };
}

export function groupByYear<T>(items: T[], getYear: (item: T) => string | number) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const y = String(getYear(item));
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(item);
  }
  return [...map.entries()];
}

export const talkTypeLabel: Record<string, string> = {
  invited: 'Invited talk',
  contributed: 'Contributed talk',
  talk: 'Talk',
  poster: 'Poster',
  seminar: 'Seminar',
  collaboration: 'Collaboration meeting',
  outreach: 'Outreach',
};

export const pubStatusLabel: Record<string, string> = {
  published: '',
  'in-press': 'In press',
  accepted: 'Accepted',
  submitted: 'Submitted',
  preprint: 'Preprint',
  'in-preparation': 'In preparation',
};

export const pubTypeLabel: Record<string, string> = {
  article: 'Article',
  proceedings: 'Conference proceedings',
  thesis: 'Thesis',
  collaboration: 'Community white paper',
  report: 'Report',
};

export const OWNER = 'G. Appagere';
