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

export type Block = {
  id: string;
  type: BlockType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
  blocks: Block[];
  templateId: string;
};

export type Msg =
  | { type: 'select'; id: string }
  | { type: 'edit'; id: string; path: string; value: string }
  | { type: 'height'; value: number };
