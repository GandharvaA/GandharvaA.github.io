// Run with: node --test scripts/lib/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tex, texUrl, smartQuotes, displayUrl, isPlaceholderUrl,
  formatDate, formatRange, dateKey, fillTemplate,
} from './cv-tex.mjs';

test('tex escapes all LaTeX specials', () => {
  assert.equal(tex('a & b % c $ d # e _ f'), 'a \\& b \\% c \\$ d \\# e \\_ f');
  assert.equal(tex('{x}'), '\\{x\\}');
  assert.equal(tex('~155 TB'), '\\textasciitilde{}155 TB');
  assert.equal(tex('x^2'), 'x\\textasciicircum{}2');
  assert.equal(tex('C:\\path'), 'C:\\textbackslash{}path');
});

test('tex does not double-escape its own output', () => {
  assert.equal(tex('\\&'), '\\textbackslash{}\\&');
  assert.equal(tex('{}'), '\\{\\}');
});

test('tex handles null, numbers and whitespace', () => {
  assert.equal(tex(null), '');
  assert.equal(tex(undefined), '');
  assert.equal(tex(2026), '2026');
  assert.equal(tex('  a\n  b\t c '), 'a b c');
  assert.equal(tex(' (for X) ', { trim: false }), ' (for X) ');
  assert.equal(tex('Jul\u00A02018'), 'Jul~2018');
});

test('tex converts square roots', () => {
  assert.equal(tex('√s = 3.46 GeV'), '\\cvsqrt{s} = 3.46 GeV');
  assert.equal(tex('(√s=3 GeV)'), '(\\cvsqrt{s}=3 GeV)');
  assert.equal(tex('√ 2'), '√ 2');
});

test('tex converts super- and subscript runs', () => {
  assert.equal(tex('Σ⁺Σ⁺'), 'Σ\\textsuperscript{+}Σ\\textsuperscript{+}');
  assert.equal(tex('K⁻'), 'K\\textsuperscript{−}');
  assert.equal(tex('x²³'), 'x\\textsuperscript{23}');
  assert.equal(tex('H₂O'), 'H\\textsubscript{2}O');
});

test('tex keeps Greek and typographic punctuation', () => {
  assert.equal(tex('ΛΛ – Λ-Λ — … · ’'), 'ΛΛ – Λ-Λ — … · ’');
  assert.equal(tex('pp→ΛΛ'), 'pp\\ensuremath{\\rightarrow}ΛΛ');
});

test('smartQuotes', () => {
  assert.equal(smartQuotes('"Hollywood Fysik" show'), '“Hollywood Fysik” show');
  assert.equal(smartQuotes("Bachelor's thesis"), 'Bachelor’s thesis');
  assert.equal(smartQuotes("Physicists' meeting"), 'Physicists’ meeting');
  assert.equal(smartQuotes("('quoted')"), '(‘quoted’)');
});

test('texUrl escapes characters that break \\href inside macro arguments', () => {
  assert.equal(texUrl('https://a.org/x#frag'), 'https://a.org/x\\#frag');
  assert.equal(texUrl('https://a.org/%20'), 'https://a.org/\\%20');
  assert.equal(texUrl('https://a.org/~user'), 'https://a.org/\\%7Euser');
  assert.equal(texUrl(' https://a.org/a b '), 'https://a.org/a\\%20b');
});

test('displayUrl and isPlaceholderUrl', () => {
  assert.equal(displayUrl('https://www.example.org/a/'), 'example.org/a');
  assert.equal(isPlaceholderUrl('https://USERNAME.github.io'), true);
  assert.equal(isPlaceholderUrl(''), true);
  assert.equal(isPlaceholderUrl('https://orcid.org/0000-0002-1825-0097'), false);
});

test('formatDate', () => {
  assert.equal(formatDate('2021-08'), 'Aug 2021');
  assert.equal(formatDate('2027'), '2027');
  assert.equal(formatDate('2026-09-08'), 'Sep 2026');
  assert.equal(formatDate('present'), 'present');
  assert.equal(formatDate('2024–2025'), '2024–2025');
  assert.equal(formatDate('2021-08', { yearOnly: true }), '2021');
});

test('formatRange', () => {
  assert.equal(formatRange('2021-08', 'present'), 'Aug 2021 – present');
  assert.equal(formatRange('2013', '2017'), '2013–2017');
  assert.equal(formatRange('2017-01', '2017-07'), 'Jan–Jul 2017');
  assert.equal(formatRange('2015-07', '2015-07'), 'Jul 2015');
  assert.equal(formatRange('2021-08', '2027', { expected: true, yearOnly: true }), '2021–2027 (expected)');
  assert.equal(formatRange('2018-09', '2019'), 'Sep 2018 – 2019');
  assert.equal(formatRange('2025', ''), '2025');
});

test('dateKey sorts mixed precision dates', () => {
  const keys = ['2025', '2025-06', '2024–2025', '2026-02'].map(dateKey);
  assert.deepEqual(keys, [202500, 202506, 202400, 202602]);
});

test('fillTemplate substitutes, handles IF blocks and rejects unknown keys', () => {
  const t = 'A %%X%%\n%%IF Y%%\nY: %%Y%%\n%%ENDIF%%\n%%IF Z%%\nZ\n%%ENDIF%%\nend';
  assert.equal(fillTemplate(t, { X: '$1 &', Y: 'yes', Z: '' }), 'A $1 &\nY: yes\nend');
  assert.throws(() => fillTemplate('%%NOPE%%', {}), /NOPE/);
});
