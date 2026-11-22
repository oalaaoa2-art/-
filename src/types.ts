export type BlockType =
  | 'nav'
  | 'hero'
  | 'features'
  | 'split'
  | 'gallery'
  | 'stats'
  | 'pricing'
  | 'quote'
  | 'cta'
  | 'contact'
  | 'footer';

// Оформление отдельного блока: размер, форма и фон «окна».
export type BlockBox = {
  width?: number; // ширина в % от страницы
  maxw?: number; // максимальная ширина в px (0 — без ограничения)
  radius?: number; // скругление углов в px
  minh?: number; // минимальная высота в px
  bg?: string; // 'none' | 'surface' | 'accent' | цвет
  align?: 'left' | 'center' | 'right';
  shadow?: boolean;
  padt?: number; // отступ сверху в px
  padb?: number; // отступ снизу в px
};

export type Block = {
  id: string;
  type: BlockType;
  box?: BlockBox;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type Page = {
  id: string;
  name: string;
  slug: string;
  blocks: Block[];
};

export type Theme = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  fontHeading: string;
  fontBody: string;
  radius: number;
  maxWidth: number;
};

export type SiteDoc = {
  name: string;
  theme: Theme;
  pages: Page[];
  current: string;
  templateId: string;
};

export type Msg =
  | { type: 'select'; id: string }
  | { type: 'edit'; id: string; path: string; value: string }
  | { type: 'height'; value: number };
