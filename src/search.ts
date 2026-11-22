import {
  BLOCK_LABELS,
  LOOKBOOK,
  PALETTES,
  SEARCH_SYNONYMS,
  STYLE_PRESETS,
  TEMPLATES,
} from './templates';
import { CATEGORY_LABELS, FONTS } from './fonts';
import type { BlockType, SiteDoc } from './types';

export type SearchKind = 'look' | 'template' | 'block' | 'style' | 'palette' | 'font' | 'page';

export type SearchHit = {
  kind: SearchKind;
  id: string;
  title: string;
  hint: string;
  score: number;
};

const KIND_LABEL: Record<SearchKind, string> = {
  look: 'Подборка',
  template: 'Шаблон',
  block: 'Блок',
  style: 'Стиль',
  palette: 'Палитра',
  font: 'Шрифт',
  page: 'Страница',
};

export const kindLabel = (kind: SearchKind): string => KIND_LABEL[kind];

const KIND_BONUS: Record<SearchKind, number> = {
  look: 8,
  template: 6,
  block: 4,
  page: 6,
  style: 3,
  palette: 2,
  font: 1,
};

const norm = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim();

const isSubsequence = (needle: string, haystack: string): boolean => {
  if (needle.length < 3) return false;
  let i = 0;
  for (const char of haystack) {
    if (char === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return false;
};

type Item = {
  kind: SearchKind;
  id: string;
  title: string;
  hint: string;
  extra: string;
};

function scoreItem(query: string, tokens: string[], item: Item): number {
  const title = norm(item.title);
  const hint = norm(item.hint);
  const extra = norm(item.extra);
  const full = norm(query);
  if (!full) return 0;

  let score = 0;
  if (title === full) score += 120;
  else if (title.startsWith(full)) score += 70;
  else if (title.includes(full)) score += 45;

  for (const token of tokens) {
    let tokenScore = 0;
    if (title.startsWith(token)) tokenScore += 50;
    else if (title.includes(` ${token}`)) tokenScore += 42;
    else if (title.includes(token)) tokenScore += 30;
    if (hint.includes(token)) tokenScore += 16;
    if (extra.includes(token)) tokenScore += 14;
    if (isSubsequence(token, title)) tokenScore += 8;
    if (!tokenScore) return 0;
    score += tokenScore;
  }

  return score + KIND_BONUS[item.kind];
}

export function searchLibrary(query: string, doc?: SiteDoc): SearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const tokens = norm(trimmed).split(' ').filter(Boolean);
  if (!tokens.length) return [];

  const items: Item[] = [];

  for (const look of LOOKBOOK) {
    items.push({
      kind: 'look',
      id: look.id,
      title: look.name,
      hint: `${look.description} Для: ${look.bestFor}`,
      extra: [look.tags.join(' '), look.bestFor, look.templateId, look.styleId].join(' '),
    });
  }

  for (const template of TEMPLATES) {
    items.push({
      kind: 'template',
      id: template.id,
      title: template.name,
      hint: template.tagline,
      extra: [template.tags.join(' '), (SEARCH_SYNONYMS[template.id] ?? []).join(' ')].join(' '),
    });
  }

  (Object.keys(BLOCK_LABELS) as BlockType[]).forEach((type) => {
    items.push({
      kind: 'block',
      id: type,
      title: BLOCK_LABELS[type].name,
      hint: BLOCK_LABELS[type].hint,
      extra: [type, (SEARCH_SYNONYMS[type] ?? []).join(' ')].join(' '),
    });
  });

  for (const style of STYLE_PRESETS) {
    items.push({
      kind: 'style',
      id: style.id,
      title: style.name,
      hint: style.tagline,
      extra: [style.tags.join(' '), style.theme.fontHeading, style.theme.fontBody].join(' '),
    });
  }

  for (const palette of PALETTES) {
    items.push({
      kind: 'palette',
      id: palette.name,
      title: palette.name,
      hint: 'Палитра цветов для всего сайта',
      extra: ['цвет цвета палитра палитры', palette.accent, palette.bg].join(' '),
    });
  }

  for (const font of FONTS) {
    items.push({
      kind: 'font',
      id: font.family,
      title: font.family,
      hint: `${CATEGORY_LABELS[font.category]} · применить к заголовкам`,
      extra: ['шрифт шрифты шрифта', font.family, font.category, CATEGORY_LABELS[font.category]].join(' '),
    });
  }

  if (doc) {
    for (const page of doc.pages) {
      items.push({
        kind: 'page',
        id: page.id,
        title: page.name,
        hint: `Страница сайта · ${page.blocks.length} блоков`,
        extra: `страница страницы ${page.slug}`,
      });
    }
  }

  return items
    .map((item) => ({ item, score: scoreItem(trimmed, tokens, item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'ru'))
    .slice(0, 40)
    .map(({ item, score }) => ({
      kind: item.kind,
      id: item.id,
      title: item.title,
      hint: item.hint,
      score,
    }));
}
