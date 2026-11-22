export type FontCategory = 'sans' | 'serif' | 'display' | 'hand' | 'mono';

export type FontDef = {
  family: string;
  category: FontCategory;
  weights: string;
  lang?: string;
};

export const CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: 'Гротески',
  serif: 'Антиквы',
  display: 'Акцидентные',
  hand: 'Рукописные',
  mono: 'Моноширинные',
};

export const FONTS: FontDef[] = [
  { family: 'Inter', category: 'sans', weights: '300;400;500;600;700;800' },
  { family: 'Manrope', category: 'sans', weights: '400;500;600;700;800' },
  { family: 'Onest', category: 'sans', weights: '400;500;600;700;800' },
  { family: 'Golos Text', category: 'sans', weights: '400;500;600;700;800' },
  { family: 'Montserrat', category: 'sans', weights: '400;500;600;700;800' },
  { family: 'Nunito', category: 'sans', weights: '400;500;600;700;800' },
  { family: 'Rubik', category: 'sans', weights: '400;500;600;700;800' },
  { family: 'Raleway', category: 'sans', weights: '400;500;600;700;800' },
  { family: 'PT Sans', category: 'sans', weights: '400;700' },
  { family: 'Unbounded', category: 'display', weights: '400;500;600;700;800' },
  { family: 'Russo One', category: 'display', weights: '400' },
  { family: 'Tektur', category: 'display', weights: '400;500;600;700;800' },
  { family: 'Comfortaa', category: 'display', weights: '400;500;600;700' },
  { family: 'Oswald', category: 'display', weights: '400;500;600;700' },
  { family: 'Playfair Display', category: 'serif', weights: '400;500;600;700;800;900' },
  { family: 'Lora', category: 'serif', weights: '400;500;600;700' },
  { family: 'PT Serif', category: 'serif', weights: '400;700' },
  { family: 'Cormorant', category: 'serif', weights: '400;500;600;700' },
  { family: 'Merriweather', category: 'serif', weights: '400;700;900' },
  { family: 'Bitter', category: 'serif', weights: '400;500;600;700;800' },
  { family: 'Spectral', category: 'serif', weights: '400;500;600;700' },
  { family: 'Caveat', category: 'hand', weights: '400;500;600;700' },
  { family: 'Marck Script', category: 'hand', weights: '400' },
  { family: 'JetBrains Mono', category: 'mono', weights: '400;500;700' },
  { family: 'IBM Plex Mono', category: 'mono', weights: '400;500;600;700' },
];

const byFamily = new Map(FONTS.map((f) => [f.family, f]));

export function googleFontsUrl(families: string[]): string {
  const parts = Array.from(new Set(families.filter(Boolean))).map((family) => {
    const def = byFamily.get(family);
    const weights = def ? def.weights : '400;700';
    return `family=${family.replace(/ /g, '+')}:wght@${weights}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}

const loaded = new Set<string>();

/** Подключает шрифты в оболочку редактора (для превью карточек шрифтов). */
export function loadFonts(families: string[]) {
  const fresh = Array.from(new Set(families)).filter((f) => f && !loaded.has(f));
  if (!fresh.length) return;
  fresh.forEach((f) => loaded.add(f));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = googleFontsUrl(fresh);
  document.head.appendChild(link);
}

export function loadAllFonts() {
  loadFonts(FONTS.map((f) => f.family));
}
