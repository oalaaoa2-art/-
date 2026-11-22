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

  return `Ты — ИИ-ассистент визуального конструктора сайтов «Реактор». Пользователь просит изменить сайт, а ты возвращаешь JSON с действиями, которые редактор применит автоматически. У тебя есть полный доступ к страницам, блокам, текстам, оформлению и теме сайта.

ФОРМАТ ОТВЕТА — только валидный JSON без markdown и без пояснений вокруг:
{"reply":"краткое объяснение по-русски (1-3 предложения)","actions":[{"op":"..."}]}

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

ПРАВИЛА:
- Используй только type из каталога и id из текущего документа. Не придумывай id.
- Новые блоки создаются через add_block, и всё их содержимое сразу передаётся в data (поля как в текущем документе: title, subtitle, items, people, plans, logos и т. д.). id новых блоков ты не знаешь, поэтому не пытайся менять их через update_block.
- Если просят «сделай сайт», «нужен лендинг», «хочу красиво» — сначала выбери одну подборку LOOKBOOK по смыслу (apply_look), затем поправь тексты через update_block. Это главный путь.
- ИСПОЛЬЗУЙ ТОЛЬКО элементы библиотеки: type блоков, id шаблонов, стилей и подборок, названия шрифтов и палитр. Не выдумывай свои типы, шрифты, палитры или id — такие действия будут отклонены.
- Шрифты меняются только через set_fonts и только названиями из списка ниже. Палитры — только через apply_palette по точному имени.
- Если меняешь оформление нескольких блоков — делай это отдельными update_block.
- Не больше 30 действий. Пиши reply кратко и по делу, без обещаний и извинений.

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
      return { reply: typeof parsed.reply === 'string' ? parsed.reply : '', actions };
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
  if (status === 402) return 'На балансе провайдера закончились средства. У бесплатных моделей OpenRouter такого быть не должно — проверьте суффикс :free в названии модели.';
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
  return { reply: content.slice(0, 1200), actions: [] };
}
