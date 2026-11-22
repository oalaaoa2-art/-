import type { SiteDoc } from './types';
import { BLOCK_LABELS, LOOKBOOK, PALETTES, STYLE_PRESETS, TEMPLATES } from './templates';
import { FONTS } from './fonts';

/* -------------------------------- providers -------------------------------- */

export type AiProviderId = 'pollinations' | 'gemini' | 'groq' | 'openrouter' | 'deepseek' | 'custom';

export type AiConfig = {
  provider: AiProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
  stepMode: boolean;
};

export type AiProvider = {
  id: AiProviderId;
  name: string;
  tagline: string;
  badge: string;
  needsKey: boolean;
  keyUrl?: string;
  models: string[];
  hint: string;
  free: boolean;
};

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'pollinations',
    name: 'Pollinations',
    tagline: 'GPT-OSS 20B, без ключа',
    badge: 'сразу работает',
    needsKey: false,
    models: ['openai-fast'],
    hint: 'Бесплатный анонимный доступ прямо из браузера. Модель GPT-OSS 20B, без регистрации и ключа.',
    free: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Бесплатный ключ AI Studio',
    badge: 'free tier',
    needsKey: true,
    keyUrl: 'https://aistudio.google.com/apikey',
    models: ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
    hint: 'У Gemini есть бесплатный лимит в Google AI Studio. Ключ хранится только в этом браузере.',
    free: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    tagline: 'Llama и Qwen, очень быстро',
    badge: 'free tier',
    needsKey: true,
    keyUrl: 'https://console.groq.com/keys',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen/qwen3-32b'],
    hint: 'Бесплатный тариф Groq: быстрые открытые модели. Ключ создаётся в консоли Groq.',
    free: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'Бесплатные модели :free',
    badge: 'free models',
    needsKey: true,
    keyUrl: 'https://openrouter.ai/keys',
    models: [
      'deepseek/deepseek-chat-v3-0324:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
    ],
    hint: 'У OpenRouter есть модели с суффиксом :free — они не тратят деньги. Нужен ключ OpenRouter.',
    free: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tagline: 'Официальный API DeepSeek',
    badge: 'по ключу',
    needsKey: true,
    keyUrl: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-flash', 'deepseek-v4-pro'],
    hint: 'Прямой API DeepSeek. Модели платные, но недорогие; ключ берётся на platform.deepseek.com.',
    free: false,
  },
  {
    id: 'custom',
    name: 'Свой прокси',
    tagline: 'OpenAI-совместимый URL',
    badge: 'для CORS-прокси',
    needsKey: true,
    models: ['gpt-4o-mini'],
    hint: 'Любой OpenAI-совместимый endpoint: свой прокси, локальный сервер или агрегатор. Укажите базовый URL и модель.',
    free: false,
  },
];

export const AI_STORAGE_KEY = 'reactor.ai.v1';

export const defaultAiConfig = (): AiConfig => ({
  provider: 'pollinations',
  apiKey: '',
  model: 'openai-fast',
  baseUrl: '',
  stepMode: true,
});

export function providerById(id: AiProviderId): AiProvider {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0];
}

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiConfig>;
      const provider = AI_PROVIDERS.some((p) => p.id === parsed.provider)
        ? (parsed.provider as AiProviderId)
        : 'pollinations';
      return {
        provider,
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
        model: typeof parsed.model === 'string' && parsed.model ? parsed.model : providerById(provider).models[0],
        baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
        stepMode: parsed.stepMode !== false,
      };
    }
  } catch {
    /* настройки повреждены — используем бесплатного провайдера по умолчанию */
  }
  return defaultAiConfig();
}

export function saveAiConfig(config: AiConfig) {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* приватный режим браузера может запрещать localStorage */
  }
}

/* --------------------------------- actions --------------------------------- */

export type AiAction = {
  op: string;
  [key: string]: unknown;
};

export type AiResult = {
  reply: string;
  actions: AiAction[];
  plan: string[];
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/* --------------------------------- prompt ---------------------------------- */

export function systemPrompt(doc: SiteDoc): string {
  const blocks = (Object.keys(BLOCK_LABELS) as (keyof typeof BLOCK_LABELS)[])
    .map((k) => `${k} — ${BLOCK_LABELS[k].name}: ${BLOCK_LABELS[k].hint}`)
    .join('\n');
  const templates = TEMPLATES.map((t) => `${t.id} — ${t.name}: ${t.tagline}`).join('\n');
  const styles = STYLE_PRESETS.map((s) => `${s.id} — ${s.name}: ${s.tagline}`).join('\n');
  const looks = LOOKBOOK.map(
    (l) =>
      `${l.id} — ${l.name} (для: ${l.bestFor}): ${l.description} Приём: ${l.notes} [шаблон ${l.templateId} + стиль ${l.styleId}]`
  ).join('\n');
  const fonts = FONTS.map((f) => f.family).join(', ');
  const palettes = PALETTES.map((p) => p.name).join(', ');

  return `Ты — ИИ-ассистент визуального конструктора сайтов «Реактор». Ты работаешь ВМЕСТЕ с человеком, а не вместо него: предлагаешь план, делаешь один шаг за раз и ждёшь, пока пользователь проверит и применит его. У тебя есть доступ к страницам, блокам, текстам, оформлению и теме, но каждое действие пользователь утверждает сам.

ФОРМАТ ОТВЕТА — только валидный JSON без markdown и без пояснений вокруг:
{"reply":"что предлагаешь на этом шаге и что изменится (1-3 предложения)","plan":["шаг 1","шаг 2","шаг 3"],"actions":[{"op":"..."}]}

ДЕЙСТВИЯ:
{"op":"add_block","type":"hero","page":"id или имя страницы","after":"id блока или null","data":{"title":"...","subtitle":"..."}} — добавить секцию. В data сразу передавай тексты и настройки нового блока (title, subtitle, kicker, cta, brand, links, items и т. д.), чтобы не оставлять шаблонные заглушки.
{"op":"update_block","id":"id блока","path":"title","value":"новый текст"} — изменить поле. path может быть "items.0.title", "people.1.role", "box.width", "box.bg".
{"op":"delete_block","id":"..."}
{"op":"duplicate_block","id":"..."}
{"op":"move_block","id":"...","dir":-1} — или "to": 2 (индекс).
{"op":"add_page","name":"О нас"} — новая пустая страница.
{"op":"rename_page","id":"...","name":"..."}
{"op":"delete_page","id":"..."}
{"op":"set_page","id":"..."} — переключить видимую страницу.
{"op":"set_theme","patch":{"accent":"#7c5cff","radius":18}} — точечные правки темы.
{"op":"apply_style","id":"noir-lime"} — готовый стиль из библиотеки (палитра+шрифты+радиусы).
{"op":"apply_palette","name":"Мята"} — только цвета из библиотеки палитр.
{"op":"set_fonts","heading":"Playfair Display","body":"Manrope"} — только шрифты из списка FONTS.
{"op":"apply_template","id":"cafe"} — заменить ВЕСЬ сайт шаблоном из библиотеки (осторожно, удаляет текущие страницы).
{"op":"apply_look","id":"quiet-saas"} — ЛУЧШИЙ вариант, когда просят сделать сайт с нуля: подборка = шаблон + подобранный стиль.

ОФОРМЛЕНИЕ БЛОКА через update_block:
box.width — ширина 30–100 (%); box.maxw — макс. ширина px; box.minh — мин. высота px; box.radius — скругление px; box.bg — "none" | "surface" | "accent" | "#hex"; box.shadow — true/false; box.align — "left" | "center" | "right"; box.padt/box.padb — отступы px.
cols — число колонок для сеток (features, gallery, stats, pricing, team, testimonials).

ПРАВИЛА РАБОТЫ (важно):
- Ты ассистент и соавтор. Не делаешь всю работу сразу: один шаг — один ответ.
- Всегда возвращай "plan" — 3–5 коротких шагов на всю задачу, простыми словами по-русски (пиши «Применить подборку и структуру», «Переписать тексты», а не названия операций вроде apply_look). В "actions" — только текущий, ПЕРВЫЙ невыполненный шаг (1–3 связанных действия). Остальные шаги пользователь попросит дальше («продолжай»).
- Если запрос широкий («сделай сайт», «нужен лендинг») — не пытайся собрать всё сразу: предложи план и в первом шаге примени одну подборку LOOKBOOK (apply_look). Затем остановись.
- Если непонятен вкус, аудитория или объём — задай ОДИН короткий вопрос в reply и предложи 2–3 варианта из библиотеки человеческими названиями (без id), а actions оставь пустым. План верни и в этом случае. Не угадывай молча и не придумывай id в тексте вопроса.
- Если пользователь пишет «продолжай», «дальше», «ок» — выполняй следующий шаг своего плана, учитывая, что уже есть в документе.
- Используй только type из каталога и id из текущего документа. Не придумывай id.
- Новые блоки создаются через add_block, и всё их содержимое сразу передаётся в data (title, subtitle, items, people, plans, logos и т. д.). id новых блоков ты не знаешь, поэтому не меняй их через update_block.
- ИСПОЛЬЗУЙ ТОЛЬКО элементы библиотеки: type блоков, id шаблонов, стилей и подборок, названия шрифтов и палитр. Не выдумывай свои типы, шрифты, палитры или id — такие действия будут отклонены.
- Шрифты меняются только через set_fonts и только названиями из списка ниже. Палитры — только через apply_palette по точному имени.
- В reply объясняй простыми словами, что именно изменится на этом шаге и что будет на следующем.
- Не больше 3 действий в ответе. Пиши кратко и по делу, без обещаний и извинений.

КАТАЛОГ БЛОКОВ:
${blocks}

ШАБЛОНЫ:
${templates}

СТИЛИ (id — название):
${styles}

ПОДБОРКИ ДИЗАЙНА (id — название, для кого, приём, из чего собрана):
${looks}

ШРИФТЫ (только эти названия):
${fonts}

ПАЛИТРЫ (только эти названия):
${palettes}

ТЕКУЩИЙ ДОКУМЕНТ (JSON):
${JSON.stringify(doc)}`;
}

/* -------------------------------- transport -------------------------------- */

const OPENAI_URLS: Record<string, string> = {
  pollinations: 'https://text.pollinations.ai/openai',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/chat/completions',
};

const normalizeBase = (base: string) =>
  base
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/, '');

function parseJsonLoose(text: string): AiResult | null {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const candidates: string[] = [raw];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1]);
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) candidates.push(raw.slice(first, last + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as { reply?: unknown; actions?: unknown };
      const actions = Array.isArray(parsed.actions)
        ? parsed.actions.filter((a): a is AiAction => !!a && typeof a === 'object' && typeof (a as AiAction).op === 'string')
        : [];
      const plan = Array.isArray((parsed as { plan?: unknown }).plan)
        ? ((parsed as { plan?: unknown[] }).plan ?? []).filter((s): s is string => typeof s === 'string' && !!s.trim())
        : [];
      return { reply: typeof parsed.reply === 'string' ? parsed.reply : '', actions, plan };
    } catch {
      /* пробуем следующий вариант */
    }
  }
  return null;
}

function friendlyError(status: number, body: string): string {
  let message = '';
  try {
    const json = JSON.parse(body) as { error?: { message?: string } | string };
    message = typeof json.error === 'string' ? json.error : json.error?.message ?? '';
  } catch {
    /* тело не JSON — покажем фрагмент как есть */
  }
  if (status === 401 || status === 403 || /api key|api_key|api-key|invalid.*key/i.test(`${body} ${message}`)) {
    return 'Провайдер не принял ключ. Проверьте API-ключ в настройках подключения — он должен быть от того же сервиса, что выбран выше.';
  }
  if (status === 402) return 'Провайдер отклонил запрос: исчерпан бесплатный лимит или баланс. Подождите минуту или смените провайдера (Gemini и Groq работают с бесплатным ключом).';
  if (status === 429) return 'Слишком много запросов: бесплатный лимит исчерпан. Подождите минуту или смените провайдера.';
  if (status === 404) return 'Модель или адрес не найдены. Проверьте название модели и базовый URL.';
  if (status === 400) {
    return message && !/api key/i.test(message)
      ? `Провайдер отклонил запрос: ${message.slice(0, 180)}`
      : 'Провайдер отклонил запрос. Проверьте ключ и название модели.';
  }
  if (status >= 500) return 'Сервис модели временно недоступен. Попробуйте ещё раз или выберите другого провайдера.';
  return message ? `Ошибка провайдера (${status}): ${message.slice(0, 180)}` : `Ошибка провайдера (${status}).`;
}

export async function askAi(
  config: AiConfig,
  doc: SiteDoc,
  history: ChatMessage[],
  text: string,
  signal?: AbortSignal
): Promise<AiResult> {
  const provider = providerById(config.provider);
  if (provider.needsKey && !config.apiKey.trim()) {
    throw new Error(`Для «${provider.name}» нужен API-ключ. Добавьте его в настройках подключения.`);
  }
  const model = config.model.trim() || provider.models[0];
  const prompt = systemPrompt(doc);
  const trimmedHistory = history.slice(-6);
  let content = '';

  if (config.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(config.apiKey.trim())}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [
          ...trimmedHistory.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text }] },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(friendlyError(res.status, bodyText));
    const json = JSON.parse(bodyText) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    content =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? '')
        .join('')
        .trim() ?? '';
  } else {
    const base = config.provider === 'custom' ? normalizeBase(config.baseUrl) : '';
    if (config.provider === 'custom' && !base) {
      throw new Error('Для своего прокси укажите базовый URL, например https://my-proxy.example.com/v1.');
    }
    const url = config.provider === 'custom' ? `${base}/chat/completions` : OPENAI_URLS[config.provider];
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`;
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = location.origin;
      headers['X-Title'] = 'Реактор';
    }
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: prompt },
        ...trimmedHistory,
        { role: 'user', content: text },
      ],
      temperature: config.provider === 'pollinations' ? 0.25 : 0.2,
      max_tokens: 4096,
    };
    if (config.provider !== 'pollinations') body.response_format = { type: 'json_object' };

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(friendlyError(res.status, bodyText));
    let json: { choices?: { message?: { content?: string } }[] };
    try {
      json = JSON.parse(bodyText);
    } catch {
      throw new Error('Провайдер вернул не JSON. Попробуйте другую модель или повторите запрос.');
    }
    content = (json.choices?.[0]?.message?.content ?? '').trim();
  }

  if (!content) throw new Error('Модель вернула пустой ответ. Попробуйте ещё раз или выберите другую модель.');
  const parsed = parseJsonLoose(content);
  if (parsed) return parsed;
  return { reply: content.slice(0, 1200), actions: [], plan: [] };
}

/* ---------------------------- human descriptions --------------------------- */

const FIELD_LABELS: Record<string, string> = {
  title: 'заголовок',
  subtitle: 'подзаголовок',
  kicker: 'надзаголовок',
  eyebrow: 'надзаголовок',
  text: 'текст',
  cta: 'кнопка',
  ctaHref: 'ссылка кнопки',
  image: 'картинка',
  brand: 'логотип',
  links: 'ссылки',
  items: 'элементы',
  people: 'люди',
  plans: 'тарифы',
  logos: 'логотипы',
  note: 'примечание',
  cols: 'колонки',
  width: 'ширина',
  maxw: 'макс. ширина',
  minh: 'мин. высота',
  radius: 'скругление',
  bg: 'фон',
  align: 'выравнивание',
  shadow: 'тень',
  padt: 'отступ сверху',
  padb: 'отступ снизу',
};

const fieldLabel = (path: string): string =>
  path
    .split('.')
    .filter((part) => !/^\d+$/.test(part))
    .map((part) => FIELD_LABELS[part] ?? part)
    .join(' → ');

const blockName = (type: unknown): string =>
  BLOCK_LABELS[String(type) as keyof typeof BLOCK_LABELS]?.name ?? String(type);

const findInDoc = (doc: SiteDoc, id: unknown) => {
  for (const page of doc.pages) {
    const block = page.blocks.find((b) => b.id === String(id));
    if (block) return { block, page };
  }
  return null;
};

/** Короткое описание действия для карточки подтверждения. */
export function describeAction(action: AiAction, doc: SiteDoc): string {
  const pageName = typeof action.page === 'string'
    ? doc.pages.find((p) => p.id === action.page || p.name === action.page)?.name ?? action.page
    : '';
  const where = pageName ? ` на «${pageName}»` : '';

  switch (action.op) {
    case 'add_block':
      return `Добавить блок «${blockName(action.type)}»${where}`;
    case 'update_block': {
      const found = findInDoc(doc, action.id);
      const name = found ? `«${blockName(found.block.type)}»` : 'блок';
      const path = typeof action.path === 'string' ? fieldLabel(action.path) : 'поле';
      const value = action.value;
      const preview =
        typeof value === 'string' && value.trim()
          ? ` → «${value.length > 60 ? `${value.slice(0, 60)}…` : value}»`
          : typeof value === 'number'
            ? ` → ${value}`
            : '';
      return `Изменить ${name}: ${path}${preview}`;
    }
    case 'delete_block': {
      const found = findInDoc(doc, action.id);
      return `Удалить блок${found ? ` «${blockName(found.block.type)}»` : ''}`;
    }
    case 'duplicate_block': {
      const found = findInDoc(doc, action.id);
      return `Дублировать блок${found ? ` «${blockName(found.block.type)}»` : ''}`;
    }
    case 'move_block':
      return `Передвинуть блок ${Number(action.dir) === -1 ? 'выше' : 'ниже'}`;
    case 'add_page':
      return `Добавить страницу «${String(action.name ?? 'Новая страница')}»`;
    case 'rename_page': {
      const page = doc.pages.find((p) => p.id === action.id);
      return `Переименовать страницу «${page?.name ?? ''}» → «${String(action.name ?? '')}»`;
    }
    case 'delete_page': {
      const page = doc.pages.find((p) => p.id === action.id);
      return `Удалить страницу${page ? ` «${page.name}»` : ''}`;
    }
    case 'set_page': {
      const page = doc.pages.find((p) => p.id === action.id);
      return `Открыть страницу${page ? ` «${page.name}»` : ''}`;
    }
    case 'set_theme': {
      const patch = (action.patch ?? {}) as Record<string, unknown>;
      const keys = Object.keys(patch).map((key) => FIELD_LABELS[key] ?? key);
      return `Настроить оформление: ${keys.join(', ') || 'тема'}`;
    }
    case 'apply_style': {
      const style = STYLE_PRESETS.find((s) => s.id === action.id);
      return style ? `Применить стиль «${style.name}»` : `Применить стиль ${String(action.id)} (нет в библиотеке)`;
    }
    case 'apply_palette':
      return `Применить палитру «${String(action.name ?? '')}»`;
    case 'set_fonts': {
      const heading = typeof action.heading === 'string' ? action.heading : '';
      const body = typeof action.body === 'string' ? action.body : '';
      return `Сменить шрифты: ${[heading, body].filter(Boolean).join(' / ') || 'из библиотеки'}`;
    }
    case 'apply_template': {
      const template = TEMPLATES.find((t) => t.id === action.id);
      return template
        ? `Заменить сайт шаблоном «${template.name}»`
        : `Заменить сайт шаблоном ${String(action.id)} (нет в библиотеке)`;
    }
    case 'apply_look': {
      const look = LOOKBOOK.find((l) => l.id === action.id);
      return look
        ? `Применить подборку «${look.name}» (шаблон + стиль)`
        : `Применить подборку ${String(action.id)} (нет в библиотеке)`;
    }
    default:
      return `Действие ${action.op}`;
  }
}
