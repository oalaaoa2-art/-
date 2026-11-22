import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildHtml } from './render';
import {
  BLOCK_LABELS,
  PALETTES,
  STORAGE_KEY,
  TEMPLATES,
  createBlock,
  docFromTemplate,
  emptyDoc,
  uid,
  type Template,
} from './templates';
import { CATEGORY_LABELS, FONTS, loadAllFonts } from './fonts';
import type { Block, BlockType, Msg, SiteDoc } from './types';

/* --------------------------------- helpers -------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setPath(obj: any, path: string, value: unknown) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] === undefined || cur[k] === null) cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const LABELS: Record<string, string> = {
  brand: 'Название / логотип',
  links: 'Ссылки меню',
  cta: 'Кнопка',
  cta2: 'Вторая кнопка',
  kicker: 'Надзаголовок',
  title: 'Заголовок',
  subtitle: 'Подзаголовок',
  text: 'Текст',
  image: 'Фото (URL)',
  images: 'Фотографии',
  url: 'URL изображения',
  caption: 'Подпись',
  items: 'Элементы',
  icon: 'Иконка',
  label: 'Подпись',
  value: 'Значение',
  bullets: 'Пункты списка',
  reverse: 'Фото справа',
  quote: 'Цитата',
  author: 'Автор',
  role: 'Роль / компания',
  email: 'Почта',
  phone: 'Телефон',
  address: 'Адрес',
  plans: 'Тарифы',
  name: 'Название',
  price: 'Цена',
  period: 'Период',
  features: 'Что входит',
  featured: 'Выделить тариф',
  note: 'Копирайт',
};

const label = (key: string) => LABELS[key] ?? key;
const MULTILINE = new Set(['title', 'subtitle', 'text', 'quote', 'address']);

function loadInitial(): SiteDoc {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SiteDoc;
      if (parsed && Array.isArray(parsed.blocks) && parsed.theme && typeof parsed.name === 'string') {
        return parsed;
      }
    }
  } catch {
    /* повреждённое сохранение — начинаем с шаблона */
  }
  return emptyDoc();
}

const DEVICES = [
  { id: 'desktop', label: 'Десктоп', width: 0 },
  { id: 'tablet', label: 'Планшет', width: 834 },
  { id: 'mobile', label: 'Телефон', width: 414 },
] as const;
type DeviceId = (typeof DEVICES)[number]['id'];

/* ---------------------------------- icons --------------------------------- */

const SVG = ({ children }: { children: ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const icons = {
  desktop: (
    <SVG>
      <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </SVG>
  ),
  tablet: (
    <SVG>
      <rect x="5" y="2.5" width="14" height="19" rx="2.2" />
      <path d="M11 18.5h2" />
    </SVG>
  ),
  mobile: (
    <SVG>
      <rect x="7" y="2" width="10" height="20" rx="2.4" />
      <path d="M11 18.8h2" />
    </SVG>
  ),
  undo: (
    <SVG>
      <path d="M4 9h9a5 5 0 0 1 0 10H8" />
      <path d="M8 5 4 9l4 4" />
    </SVG>
  ),
  redo: (
    <SVG>
      <path d="M20 9h-9a5 5 0 0 0 0 10h5" />
      <path d="m16 5 4 4-4 4" />
    </SVG>
  ),
  download: (
    <SVG>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 20h16" />
    </SVG>
  ),
  up: (
    <SVG>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </SVG>
  ),
  down: (
    <SVG>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </SVG>
  ),
  copy: (
    <SVG>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2 2 0 0 0-2 2v8.5A2.5 2.5 0 0 0 6.5 16" />
    </SVG>
  ),
  trash: (
    <SVG>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </SVG>
  ),
  plus: (
    <SVG>
      <path d="M12 5v14M5 12h14" />
    </SVG>
  ),
  panels: (
    <SVG>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </SVG>
  ),
  sliders: (
    <SVG>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </SVG>
  ),
};

/* -------------------------------- inspector -------------------------------- */

function Blank(value: unknown): unknown {
  if (typeof value === 'string') return '';
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = Blank(v);
    return out;
  }
  return '';
}

function Field({
  path,
  name,
  value,
  onChange,
}: {
  path: string;
  name: string;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
}) {
  if (typeof value === 'string') {
    const long = MULTILINE.has(name);
    return (
      <label className="fld">
        <span>{label(name)}</span>
        {long ? (
          <textarea rows={3} value={value} onChange={(e) => onChange(path, e.target.value)} />
        ) : (
          <input value={value} onChange={(e) => onChange(path, e.target.value)} />
        )}
      </label>
    );
  }

  if (typeof value === 'number') {
    return (
      <label className="fld">
        <span>{label(name)}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(path, Number(e.target.value) || 0)}
        />
      </label>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <label className="fld check">
        <input type="checkbox" checked={value} onChange={(e) => onChange(path, e.target.checked)} />
        <span>{label(name)}</span>
      </label>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="fld-group">
        <div className="fld-head">
          <span>{label(name)}</span>
          <button
            type="button"
            className="mini"
            title="Добавить"
            onClick={() => onChange(path, [...value, Blank(value[0] ?? '')])}
          >
            {icons.plus}
          </button>
        </div>
        {value.length === 0 && <p className="hint">Пока пусто</p>}
        {value.map((item, i) => (
          <div className="arr-item" key={i}>
            <button
              type="button"
              className="mini del"
              title="Удалить"
              onClick={() => onChange(path, value.filter((_, j) => j !== i))}
            >
              {icons.trash}
            </button>
            {typeof item === 'object' && item !== null ? (
              <div className="arr-body">
                {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                  <Field key={k} path={`${path}.${i}.${k}`} name={k} value={v} onChange={onChange} />
                ))}
              </div>
            ) : (
              <Field path={`${path}.${i}`} name={name} value={item} onChange={onChange} />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <div className="fld-group">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <Field key={k} path={`${path}.${k}`} name={k} value={v} onChange={onChange} />
        ))}
      </div>
    );
  }

  return null;
}

/* ---------------------------------- app ----------------------------------- */

export default function App() {
  const [doc, setDoc] = useState<SiteDoc>(loadInitial);
  const [rev, setRev] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceId>('desktop');
  const [tab, setTab] = useState<'templates' | 'blocks' | 'fonts' | 'style'>('templates');
  const [frameH, setFrameH] = useState(1100);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saved, setSaved] = useState(true);
  const [drawer, setDrawer] = useState<'rail' | 'insp' | null>(null);
  const [welcome, setWelcome] = useState(true);

  const docRef = useRef(doc);
  docRef.current = doc;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const past = useRef<SiteDoc[]>([]);
  const future = useRef<SiteDoc[]>([]);

  useEffect(() => {
    loadAllFonts();
  }, []);

  useEffect(() => {
    setSaved(false);
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      } catch {
        /* переполнение хранилища не критично */
      }
      setSaved(true);
    }, 400);
    return () => clearTimeout(id);
  }, [doc]);

  const apply = (mutate: (d: SiteDoc) => void) => {
    const current = clone(docRef.current);
    const next = clone(docRef.current);
    mutate(next);
    past.current.push(current);
    if (past.current.length > 80) past.current.shift();
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setDoc(next);
    setRev((r) => r + 1);
  };

  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(clone(docRef.current));
    setDoc(prev);
    setRev((r) => r + 1);
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(clone(docRef.current));
    setDoc(next);
    setRev((r) => r + 1);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  };

  const html = useMemo(
    () => buildHtml(docRef.current, { editable: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rev]
  );

  const selectedBlock = doc.blocks.find((b) => b.id === selected) ?? null;

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data as Msg;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'select') setSelected(data.id);
      if (data.type === 'height' && data.value > 0) {
        setFrameH(Math.min(Math.max(Math.round(data.value), 400), 20000));
      }
      if (data.type === 'edit') {
        setDoc((prev) => {
          const next = clone(prev);
          const block = next.blocks.find((b) => b.id === data.id);
          if (!block) return prev;
          setPath(block, data.path, data.value);
          return next;
        });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'highlight', id: selected }, '*');
  }, [selected, rev]);

  const patchBlock = (path: string, value: unknown) => {
    if (!selectedBlock) return;
    apply((d) => {
      const block = d.blocks.find((b) => b.id === selectedBlock.id);
      if (block) setPath(block, path, value);
    });
  };

  const patchTheme = (patch: Partial<SiteDoc['theme']>) => {
    apply((d) => {
      d.theme = { ...d.theme, ...patch };
    });
  };

  const addBlock = (type: BlockType) => {
    const block = createBlock(type);
    apply((d) => {
      const idx = selected ? d.blocks.findIndex((b) => b.id === selected) : d.blocks.length - 1;
      d.blocks.splice(idx + 1, 0, block);
    });
    setSelected(block.id);
  };

  const moveBlock = (dir: -1 | 1) => {
    if (!selectedBlock) return;
    apply((d) => {
      const i = d.blocks.findIndex((b) => b.id === selectedBlock.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.blocks.length) return;
      [d.blocks[i], d.blocks[j]] = [d.blocks[j], d.blocks[i]];
    });
  };

  const duplicateBlock = () => {
    if (!selectedBlock) return;
    const copy: Block = { ...clone(selectedBlock), id: uid() };
    apply((d) => {
      const i = d.blocks.findIndex((b) => b.id === selectedBlock.id);
      d.blocks.splice(i + 1, 0, copy);
    });
    setSelected(copy.id);
  };

  const deleteBlock = () => {
    if (!selectedBlock) return;
    apply((d) => {
      d.blocks = d.blocks.filter((b) => b.id !== selectedBlock.id);
    });
    setSelected(null);
  };

  const useTemplate = (t: Template) => {
    const dirty = past.current.length > 0;
    if (dirty && !window.confirm(`Заменить текущую страницу шаблоном «${t.name}»? Несохранённые правки пропадут.`)) {
      return;
    }
    const next = docFromTemplate(t);
    past.current.push(clone(docRef.current));
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setDoc(next);
    setSelected(null);
    setRev((r) => r + 1);
    setDrawer(null);
  };

  const startBlank = () => {
    setDoc(emptyDoc());
    past.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setSelected(null);
    setRev((r) => r + 1);
    setWelcome(false);
  };

  const openTemplates = () => {
    setTab('templates');
    setDrawer('rail');
    setWelcome(false);
  };

  const openBlocks = () => {
    setTab('blocks');
    setDrawer('rail');
  };

  const resetProject = () => {
    if (!window.confirm('Очистить страницу и начать заново с пустой страницы?')) return;
    setDoc(emptyDoc());
    past.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setSelected(null);
    setRev((r) => r + 1);
  };

  const exportHtml = () => {
    const out = buildHtml(docRef.current, { editable: false });
    const blob = new Blob([out], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(doc.name || 'site').trim().toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || 'site'}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const deviceWidth = DEVICES.find((d) => d.id === device)?.width ?? 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <span className="logo-mark">⚛</span>
          <span className="logo-text">Реактор</span>
          <span className="beta">free</span>
        </div>

        <button className="icon-btn only-narrow" title="Шаблоны и блоки" onClick={() => setDrawer(drawer === 'rail' ? null : 'rail')}>
          {icons.panels}
        </button>

        <input
          className="docname"
          value={doc.name}
          aria-label="Название сайта"
          onChange={(e) => {
            const name = e.target.value;
            setDoc((prev) => ({ ...prev, name }));
          }}
        />

        <div className="spacer" />

        <div className="seg devices">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              className={device === d.id ? 'active' : ''}
              title={d.label}
              onClick={() => {
                setDevice(d.id);
                setFrameH(1100);
              }}
            >
              {icons[d.id]}
            </button>
          ))}
        </div>

        <button className="icon-btn" title="Отменить" onClick={undo} disabled={!canUndo}>
          {icons.undo}
        </button>
        <button className="icon-btn" title="Повторить" onClick={redo} disabled={!canRedo}>
          {icons.redo}
        </button>

        <span className={`save-state ${saved ? '' : 'dirty'}`}>{saved ? 'Сохранено' : 'Сохраняем…'}</span>

        <button className="icon-btn" title="О редакторе" onClick={() => setWelcome(true)}>
          <span className="help-mark">?</span>
        </button>

        <button className="btn primary" onClick={exportHtml}>
          {icons.download}
          Скачать HTML
        </button>

        <button className="icon-btn only-narrow" title="Свойства блока" onClick={() => setDrawer(drawer === 'insp' ? null : 'insp')}>
          {icons.sliders}
        </button>
      </header>

      <div className="body">
        <aside className={`rail ${drawer === 'rail' ? 'open' : ''}`}>
          <div className="tabs">
            <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>
              Шаблоны
            </button>
            <button className={tab === 'blocks' ? 'active' : ''} onClick={() => setTab('blocks')}>
              Блоки
            </button>
            <button className={tab === 'fonts' ? 'active' : ''} onClick={() => setTab('fonts')}>
              Шрифты
            </button>
            <button className={tab === 'style' ? 'active' : ''} onClick={() => setTab('style')}>
              Стиль
            </button>
          </div>

          <div className="panel">
            {tab === 'templates' && (
              <>
                <p className="panel-lead">
                  Готовые страницы. Выберите шаблон — дальше правьте текст прямо на холсте.
                </p>
                <div className="tpl-grid">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      className={`tpl ${doc.templateId === t.id ? 'active' : ''}`}
                      onClick={() => useTemplate(t)}
                    >
                      <div
                        className="tpl-preview"
                        style={{ background: t.theme.bg, color: t.theme.text }}
                      >
                        <span
                          className="tpl-brand"
                          style={{ fontFamily: `'${t.theme.fontHeading}', sans-serif` }}
                        >
                          {t.name}
                        </span>
                        <span className="tpl-line" style={{ background: t.theme.accent }} />
                        <span className="tpl-line short" style={{ background: t.theme.muted, opacity: 0.5 }} />
                        <span className="tpl-pill" style={{ background: t.theme.accent }} />
                        <span className="tpl-pill ghost" style={{ borderColor: t.theme.muted }} />
                        <span className="tpl-dots">
                          <i style={{ background: t.theme.accent }} />
                          <i style={{ background: t.theme.surface, border: `1px solid ${t.theme.muted}` }} />
                          <i style={{ background: t.theme.text, opacity: 0.75 }} />
                        </span>
                      </div>
                      <span className="tpl-name">{t.name}</span>
                      <span className="tpl-tags">{t.tags.join(' · ')}</span>
                    </button>
                  ))}
                </div>
                <button className="ghost-btn wide" onClick={resetProject}>
                  Очистить страницу
                </button>
              </>
            )}

            {tab === 'blocks' && (
              <>
                <p className="panel-lead">Добавьте секцию — она встанет после выделенного блока.</p>
                <div className="block-list">
                  {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => (
                    <button key={type} className="block-item" onClick={() => addBlock(type)}>
                      <span className="block-icon">{BLOCK_LABELS[type].icon}</span>
                      <span className="block-meta">
                        <strong>{BLOCK_LABELS[type].name}</strong>
                        <em>{BLOCK_LABELS[type].hint}</em>
                      </span>
                      <span className="block-add">{icons.plus}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {tab === 'fonts' && (
              <>
                <p className="panel-lead">
                  {FONTS.length} семейств с поддержкой кириллицы. Сначала выберите шрифт заголовков, потом
                  основной текст.
                </p>
                {(['heading', 'body'] as const).map((slot) => (
                  <div className="font-slot" key={slot}>
                    <div className="slot-head">
                      <span>{slot === 'heading' ? 'Заголовки' : 'Основной текст'}</span>
                      <strong style={{ fontFamily: `'${doc.theme[slot === 'heading' ? 'fontHeading' : 'fontBody']}', serif` }}>
                        {doc.theme[slot === 'heading' ? 'fontHeading' : 'fontBody']}
                      </strong>
                    </div>
                    {(Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[]).map((cat) => (
                      <div key={cat} className="font-cat">
                        <span className="cat-name">{CATEGORY_LABELS[cat]}</span>
                        {FONTS.filter((f) => f.category === cat).map((f) => {
                          const active =
                            doc.theme[slot === 'heading' ? 'fontHeading' : 'fontBody'] === f.family;
                          return (
                            <button
                              key={f.family}
                              className={`font-item ${active ? 'active' : ''}`}
                              style={{ fontFamily: `'${f.family}', sans-serif` }}
                              onClick={() =>
                                patchTheme(slot === 'heading' ? { fontHeading: f.family } : { fontBody: f.family })
                              }
                            >
                              {f.family}
                              {active && <span className="tick">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {tab === 'style' && (
              <>
                <p className="panel-lead">Палитры и геометрия. Цвета можно подобрать вручную.</p>
                <div className="palette-grid">
                  {PALETTES.map((p) => (
                    <button
                      key={p.name}
                      className="palette"
                      onClick={() =>
                        patchTheme({
                          bg: p.bg,
                          surface: p.surface,
                          text: p.text,
                          muted: p.muted,
                          accent: p.accent,
                          accentText: p.accentText,
                        })
                      }
                    >
                      <span className="swatches" style={{ background: p.bg }}>
                        <i style={{ background: p.accent }} />
                        <i style={{ background: p.text }} />
                        <i style={{ background: p.muted }} />
                      </span>
                      <span className="palette-name">{p.name}</span>
                    </button>
                  ))}
                </div>

                <div className="color-row">
                  <label>
                    <span>Акцент</span>
                    <input type="color" value={doc.theme.accent} onChange={(e) => patchTheme({ accent: e.target.value })} />
                  </label>
                  <label>
                    <span>Фон</span>
                    <input type="color" value={doc.theme.bg} onChange={(e) => patchTheme({ bg: e.target.value })} />
                  </label>
                  <label>
                    <span>Текст</span>
                    <input type="color" value={doc.theme.text} onChange={(e) => patchTheme({ text: e.target.value })} />
                  </label>
                </div>

                <label className="range">
                  <span>Скругление: {doc.theme.radius}px</span>
                  <input
                    type="range"
                    min={0}
                    max={36}
                    value={doc.theme.radius}
                    onChange={(e) => patchTheme({ radius: Number(e.target.value) })}
                  />
                </label>
                <label className="range">
                  <span>Ширина контента: {doc.theme.maxWidth}px</span>
                  <input
                    type="range"
                    min={880}
                    max={1400}
                    step={20}
                    value={doc.theme.maxWidth}
                    onChange={(e) => patchTheme({ maxWidth: Number(e.target.value) })}
                  />
                </label>
              </>
            )}
          </div>
        </aside>

        <div className="canvas-wrap">
          <button className="fab-tpl" onClick={openTemplates} title="Готовые шаблоны">
            <span>Шаблоны</span>
          </button>

          <main className="canvas">
          {doc.blocks.length === 0 ? (
            <div className="stage empty-stage">
              <div className="empty-page">
                <div className="empty-mark">◈</div>
                <h2>Страница пуста</h2>
                <p>
                  Добавьте первый блок — шапку, первый экран, галерею — или возьмите готовый шаблон целиком.
                  Остальное настраивается справа.
                </p>
                <div className="empty-actions">
                  <button className="btn primary" onClick={openBlocks}>
                    {icons.plus}
                    Добавить блок
                  </button>
                  <button className="btn ghost" onClick={openTemplates}>
                    Смотреть шаблоны
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <div className="stage">
            <div
              className="frame"
              style={deviceWidth ? { width: deviceWidth, maxWidth: '100%' } : { width: '100%' }}
            >
              <div className="frame-bar">
                <span className="dots">
                  <i style={{ background: '#ff5f57' }} />
                  <i style={{ background: '#febc2e' }} />
                  <i style={{ background: '#28c840' }} />
                </span>
                <span className="frame-url">{doc.name.toLowerCase().replace(/\s+/g, '-')}.site</span>
                <span className="frame-size">
                  {deviceWidth ? `${deviceWidth}px` : 'авто'}
                </span>
              </div>
              <iframe
                ref={iframeRef}
                key={`${rev}-${device}`}
                title="Превью сайта"
                className="site-frame"
                srcDoc={html}
                style={{ height: frameH }}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
            <p className="canvas-hint">
              Кликните по тексту на странице, чтобы править его на месте · выделенный блок настраивается справа
            </p>
          </div>
          )}
          </main>
        </div>

        <aside className={`inspector ${drawer === 'insp' ? 'open' : ''}`}>
          {selectedBlock ? (
            <>
              <div className="insp-head">
                <div>
                  <span className="insp-type">{BLOCK_LABELS[selectedBlock.type].name}</span>
                  <span className="insp-id">#{doc.blocks.findIndex((b) => b.id === selectedBlock.id) + 1}</span>
                </div>
                <div className="insp-actions">
                  <button className="mini" title="Выше" onClick={() => moveBlock(-1)}>
                    {icons.up}
                  </button>
                  <button className="mini" title="Ниже" onClick={() => moveBlock(1)}>
                    {icons.down}
                  </button>
                  <button className="mini" title="Дублировать" onClick={duplicateBlock}>
                    {icons.copy}
                  </button>
                  <button className="mini del" title="Удалить" onClick={deleteBlock}>
                    {icons.trash}
                  </button>
                </div>
              </div>
              <div className="panel">
                {Object.entries(selectedBlock)
                  .filter(([k]) => k !== 'id' && k !== 'type')
                  .map(([k, v]) => (
                    <Field key={k} path={k} name={k} value={v} onChange={patchBlock} />
                  ))}
                <button className="ghost-btn wide" onClick={deleteBlock}>
                  Удалить блок
                </button>
              </div>
            </>
          ) : (
            <div className="empty-insp">
              <div className="empty-mark">◈</div>
              <h3>Настройки блока</h3>
              <p>
                Выберите секцию на холсте или введите текст прямо на странице. Здесь появятся поля для
                изображений, списков и тарифов.
              </p>
              <div className="stat-row">
                <div>
                  <strong>{doc.blocks.length}</strong>
                  <span>блоков</span>
                </div>
                <div>
                  <strong>{doc.theme.fontHeading}</strong>
                  <span>заголовки</span>
                </div>
                <div>
                  <strong>{doc.theme.fontBody}</strong>
                  <span>текст</span>
                </div>
              </div>
              <p className="hint">
                Всё сохраняется в браузере автоматически. Готовый сайт забирается кнопкой «Скачать HTML».
              </p>
            </div>
          )}
        </aside>
      </div>

      {welcome && (
        <div className="welcome">
          <div className="welcome-card">
            <div className="welcome-head">
              <span className="welcome-mark">⚛</span>
              <span className="welcome-tag">бесплатно · без регистрации · без бэкенда</span>
            </div>
            <h1>Реактор</h1>
            <p className="welcome-lead">
              Конструктор сайтов прямо в браузере. Выберите шаблон или начните с пустой страницы, печатайте текст
              кликом на холсте, подбирайте шрифты и палитру — а готовый сайт скачайте одним HTML-файлом.
            </p>
            <div className="welcome-points">
              <div>
                <strong>6</strong>
                <span>готовых шаблонов</span>
              </div>
              <div>
                <strong>11</strong>
                <span>типов блоков</span>
              </div>
              <div>
                <strong>25</strong>
                <span>шрифтов с кириллицей</span>
              </div>
            </div>
            <div className="welcome-actions">
              <button className="btn primary big" onClick={startBlank}>
                Начать с пустой страницы
              </button>
              <button className="btn ghost big" onClick={openTemplates}>
                Выбрать шаблон
              </button>
            </div>
            {doc.blocks.length > 0 && (
              <button className="welcome-resume" onClick={() => setWelcome(false)}>
                Продолжить с «{doc.name}»
              </button>
            )}
            <p className="welcome-note">
              Черновик сохраняется в этом браузере автоматически. Экспорт — кнопка «Скачать HTML» сверху.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
