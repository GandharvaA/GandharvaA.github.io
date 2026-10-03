// Pure helpers for the CV generator: LaTeX escaping, URLs and date formatting.

const SPECIALS = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  $: '\\$',
  '&': '\\&',
  '%': '\\%',
  '#': '\\#',
  _: '\\_',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

// The body font has no superscript/subscript or arrow glyphs.
const SUPERSCRIPTS = {
  '⁺': '+', '⁻': '−', '⁼': '=', '⁽': '(', '⁾': ')', 'ⁿ': 'n', 'ⁱ': 'i',
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
};
const SUBSCRIPTS = {
  '₊': '+', '₋': '−', '₌': '=', '₍': '(', '₎': ')',
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};
const REPLACEMENTS = {
  '→': '\\ensuremath{\\rightarrow}',
  '←': '\\ensuremath{\\leftarrow}',
  '↔': '\\ensuremath{\\leftrightarrow}',
  '⇒': '\\ensuremath{\\Rightarrow}',
  '\u00A0': '~',
  '\u2009': '\\,',
  '\u202F': '\\,',
  '\u200B': '',
  '\u00AD': '\\-',
};

const QUOTE_OPENERS = /(^|[\s([{\u2014\u2013/-])/;

/** Straight quotes → typographic quotes (apostrophes become ’). */
export function smartQuotes(s) {
  return s
    .replace(new RegExp(QUOTE_OPENERS.source + '"', 'g'), '$1“')
    .replace(/"/g, '”')
    .replace(new RegExp(QUOTE_OPENERS.source + "'", 'g'), '$1‘')
    .replace(/'/g, '’');
}

/**
 * Escape arbitrary data text for LaTeX body text (XeLaTeX, TU encoding).
 * Collapses whitespace, escapes the ten specials, converts quotes, "√x" → \cvsqrt{x},
 * and runs of Unicode super/subscripts → \textsuperscript / \textsubscript.
 */
export function tex(value, { trim = true } = {}) {
  if (value === null || value === undefined) return '';
  const collapsed = String(value).normalize('NFC').replace(/[ \t\n\r\f\v]+/g, ' ');
  const chars = [...smartQuotes(trim ? collapsed.trim() : collapsed)];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (Object.hasOwn(SPECIALS, ch)) {
      out += SPECIALS[ch];
    } else if (ch === '√') {
      let arg = '';
      while (i + 1 < chars.length && /[A-Za-z]/.test(chars[i + 1])) arg += chars[++i];
      out += arg ? `\\cvsqrt{${arg}}` : '√';
    } else if (Object.hasOwn(SUPERSCRIPTS, ch) || Object.hasOwn(SUBSCRIPTS, ch)) {
      const table = Object.hasOwn(SUPERSCRIPTS, ch) ? SUPERSCRIPTS : SUBSCRIPTS;
      let run = '';
      while (i < chars.length && Object.hasOwn(table, chars[i])) run += table[chars[i++]];
      i--;
      out += `\\text${table === SUPERSCRIPTS ? 'super' : 'sub'}script{${run}}`;
    } else if (Object.hasOwn(REPLACEMENTS, ch)) {
      out += REPLACEMENTS[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

/** Escape a URL for the first argument of \href (safe inside other macro arguments). */
export function texUrl(url) {
  return String(url ?? '')
    .trim()
    .replace(/[\\{}^~\s]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#');
}

/** \href with escaped URL and escaped display text. */
export function href(url, text) {
  return `\\href{${texUrl(url)}}{${tex(text)}}`;
}

/** "https://www.example.org/a/" → "example.org/a" */
export function displayUrl(url) {
  return String(url).trim().replace(/^[a-z]+:\/\//i, '').replace(/^www\./, '').replace(/\/+$/, '');
}

/** True for empty values and obvious template placeholders such as https://USERNAME.github.io. */
export function isPlaceholderUrl(url) {
  const u = String(url ?? '').trim();
  return !u || /USERNAME|YOUR[-_]?NAME|example\.(com|org)|TODO|0000-0000/i.test(u);
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

/** Parse "YYYY", "YYYY-MM" or "YYYY-MM-DD"; null for anything else. */
export function parseDate(value) {
  const m = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(String(value ?? '').trim());
  if (!m) return null;
  const month = m[2] ? Number(m[2]) : null;
  if (month !== null && (month < 1 || month > 12)) return null;
  return { year: Number(m[1]), month };
}

/** "2021-08" → "Aug 2021", "2027" → "2027", "present" → "present"; other strings pass through. */
export function formatDate(value, { yearOnly = false } = {}) {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value).trim();
  if (/^present$/i.test(s)) return 'present';
  const d = parseDate(s);
  if (!d) return s;
  return d.month && !yearOnly ? `${MONTHS[d.month - 1]} ${d.year}` : String(d.year);
}

/** Date range with an en dash; spaced only when either side contains a space. */
export function formatRange(start, end, { expected = false, yearOnly = false } = {}) {
  const a = formatDate(start, { yearOnly });
  const b = formatDate(end, { yearOnly });
  const suffix = expected && b ? ' (expected)' : '';
  if (!a) return b + suffix;
  if (!b || a === b) return a + suffix;
  const da = parseDate(start);
  const de = parseDate(end);
  if (!yearOnly && da?.month && de?.month && da.year === de.year) {
    return `${MONTHS[da.month - 1]}–${MONTHS[de.month - 1]} ${da.year}${suffix}`;
  }
  return (a.includes(' ') || b.includes(' ') ? `${a} – ${b}` : `${a}–${b}`) + suffix;
}

/** Sortable numeric key (YYYYMM) for a date-like string; handles "2024–2025" via its first year. */
export function dateKey(value) {
  const s = String(value ?? '').trim();
  if (/^present$/i.test(s)) return 999999;
  const d = parseDate(s);
  if (d) return d.year * 100 + (d.month ?? 0);
  const y = /(\d{4})/.exec(s);
  return y ? Number(y[1]) * 100 : 0;
}

/** "October 2026" for the given date. */
export function monthYear(date = new Date()) {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** Replace %%KEY%% placeholders and %%IF KEY%%…%%ENDIF%% blocks; throws on unknown keys. */
export function fillTemplate(template, values, name = 'template') {
  const missing = new Set();
  const has = (key) => Object.hasOwn(values, key);
  let out = template.replace(/%%IF ([A-Z0-9_]+)%%\n?([\s\S]*?)%%ENDIF%%\n?/g, (_, key, body) => {
    if (!has(key)) missing.add(key);
    return String(values[key] ?? '').trim() ? body : '';
  });
  out = out.replace(/%%([A-Z0-9_]+)%%/g, (_, key) => {
    if (!has(key)) missing.add(key);
    return String(values[key] ?? '');
  });
  if (missing.size) throw new Error(`${name}: unknown placeholder(s) ${[...missing].join(', ')}`);
  return out;
}
