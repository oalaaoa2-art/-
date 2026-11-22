import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AI_PROVIDERS,
  askAi,
  describeAction,
  loadAiConfig,
  providerById,
  saveAiConfig,
  type AiAction,
  type AiConfig,
  type AiProviderId,
  type ChatMessage,
} from './ai';
import type { SiteDoc } from './types';
import { BLOCK_LABELS, LOOKBOOK, STYLE_PRESETS, TEMPLATES } from './templates';
import { FONTS } from './fonts';

type Entry = ChatMessage & {
  plan?: string[];
  actions?: AiAction[];
  status?: 'pending' | 'applied' | 'skipped';
  note?: string;
};

const QUICK = [
  'Хочу сайт для кофейни — предложи план',
  'Сделай тёмный лендинг для агентства',
  'Добавь страницу «О нас» с командой',
  'Сделай блоки чуть уже и с фоном',
];

export default function AiPanel({
  doc,
  onActions,
}: {
  doc: SiteDoc;
  onActions: (actions: AiAction[]) => string;
}) {
  const [config, setConfig] = useState<AiConfig>(loadAiConfig);
  const [setup, setSetup] = useState(() => !loadAiConfig().apiKey && providerById(loadAiConfig().provider).needsKey);
  const [messages, setMessages] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chatRef = useRef<HTMLDivElement | null>(null);

  const provider = useMemo(() => providerById(config.provider), [config.provider]);
  const ready = !provider.needsKey || !!config.apiKey.trim();

  useEffect(() => {
    saveAiConfig(config);
  }, [config]);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const patch = (next: Partial<AiConfig>) => setConfig((prev) => ({ ...prev, ...next }));

  const chooseProvider = (id: AiProviderId) => {
    const p = providerById(id);
    setError('');
    setConfig((prev) => ({
      ...prev,
      provider: id,
      model: p.models[0],
      baseUrl: id === 'custom' ? prev.baseUrl : '',
    }));
  };

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setError('');
    setInput('');
    const history: ChatMessage[] = messages
      .filter((m) => m.content)
      .map((m) => ({
        role: m.role,
        content:
          m.plan && m.plan.length
            ? `${m.content}\nПлан: ${m.plan.map((s, i) => `${i + 1}. ${s}`).join('; ')}`
            : m.content,
      }));
    setMessages((prev) => [
      ...prev.map((m) => (m.status === 'pending' ? { ...m, status: 'skipped' as const } : m)),
      { role: 'user', content: prompt },
    ]);
    setBusy(true);
    try {
      const result = await askAi(config, doc, history, prompt);
      const actions = result.actions;
      if (actions.length && !config.stepMode) {
        const note = onActions(actions);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.reply || 'Готово — применил шаг.',
            plan: result.plan,
            actions,
            status: 'applied',
            note: note || undefined,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              result.reply ||
              (actions.length ? 'Проверьте шаг и примените его.' : 'Не понял задачу. Сформулируйте иначе.'),
            plan: result.plan,
            actions,
            status: actions.length ? 'pending' : undefined,
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const applyEntry = (index: number) => {
    const entry = messages[index];
    if (!entry?.actions?.length) return;
    const note = onActions(entry.actions);
    setMessages((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, status: 'applied', note: note || 'Готово' } : m
      )
    );
  };

  const skipEntry = (index: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, status: 'skipped' } : m))
    );
  };

  return (
    <div className="ai-panel">
      <div className="ai-head">
        <div className="ai-title">
          <span className="ai-mark">✦</span>
          <span>ИИ-ассистент</span>
        </div>
        <button
          className="mini"
          title="Настройки подключения"
          onClick={() => setSetup((v) => !v)}
        >
          ⚙
        </button>
      </div>

      {setup && (
        <div className="ai-setup">
          <p className="panel-lead">
            Подключите бесплатную модель или свой ключ. Ключ хранится только в этом браузере и уходит напрямую
            выбранному провайдеру.
          </p>
          <div className="ai-providers">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                className={`ai-provider ${config.provider === p.id ? 'active' : ''}`}
                onClick={() => chooseProvider(p.id)}
              >
                <span className="ai-provider-name">{p.name}</span>
                <span className={`ai-badge ${p.free ? 'free' : ''}`}>{p.badge}</span>
                <span className="ai-provider-tag">{p.tagline}</span>
              </button>
            ))}
          </div>
          <p className="hint">{provider.hint}</p>
          {provider.needsKey && (
            <label className="fld">
              <span>API-ключ {provider.name}</span>
              <input
                type="password"
                value={config.apiKey}
                placeholder="sk-..."
                autoComplete="off"
                onChange={(e) => patch({ apiKey: e.target.value })}
              />
            </label>
          )}
          {provider.keyUrl && (
            <a className="ai-link" href={provider.keyUrl} target="_blank" rel="noopener noreferrer">
              Получить ключ {provider.name} →
            </a>
          )}
          {config.provider === 'custom' ? (
            <>
              <label className="fld">
                <span>Базовый URL (OpenAI-совместимый)</span>
                <input
                  value={config.baseUrl}
                  placeholder="https://my-proxy.example.com/v1"
                  onChange={(e) => patch({ baseUrl: e.target.value })}
                />
              </label>
              <label className="fld">
                <span>Модель</span>
                <input value={config.model} onChange={(e) => patch({ model: e.target.value })} />
              </label>
            </>
          ) : (
            <label className="fld">
              <span>Модель</span>
              <input
                list="ai-models"
                value={config.model}
                onChange={(e) => patch({ model: e.target.value })}
              />
              <datalist id="ai-models">
                {provider.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </label>
          )}
          <label className="ai-check">
            <input
              type="checkbox"
              checked={config.stepMode}
              onChange={(e) => patch({ stepMode: e.target.checked })}
            />
            <span>Спрашивать перед каждым шагом</span>
          </label>
          <button className="btn primary wide" onClick={() => setSetup(false)} disabled={!ready}>
            {ready ? 'Готово' : 'Введите ключ'}
          </button>
          <p className="hint">
            Если браузер блокирует запрос (CORS), используйте Pollinations или свой прокси. Ключ не отправляется
            никуда, кроме выбранного API.
          </p>
        </div>
      )}

      {!setup && (
        <>
          <div className="ai-status">
            <span className={`ai-dot ${ready ? 'ok' : ''}`} />
            <span className="ai-status-name">
              {provider.name} · {config.model}
            </span>
            <button
              className={`ai-mode ${config.stepMode ? 'on' : ''}`}
              title="Ассистент предлагает шаг, а вы применяете его сами"
              onClick={() => patch({ stepMode: !config.stepMode })}
            >
              {config.stepMode ? 'пошагово' : 'сразу всё'}
            </button>
            <button className="mini" title="Сменить модель" onClick={() => setSetup(true)}>
              ⚙
            </button>
          </div>

          <div className="ai-chat" ref={chatRef}>
            {messages.length === 0 && (
              <div className="ai-empty">
                <p>
                  Ассистент сначала предложит план и покажет один шаг с понятным описанием. Вы проверяете его и
                  нажимаете «Применить шаг» — только тогда сайт изменится. Всё отменяется через Ctrl+Z.
                </p>
                <p className="ai-library">
                  Библиотека: блоков {Object.keys(BLOCK_LABELS).length} · шаблонов {TEMPLATES.length} · подборок{' '}
                  {LOOKBOOK.length} · стилей {STYLE_PRESETS.length} · шрифтов {FONTS.length}
                </p>
                <div className="ai-quick">
                  {QUICK.map((q) => (
                    <button key={q} onClick={() => void send(q)} disabled={busy || !ready}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                <div className="ai-bubble">{m.content}</div>
                {m.role === 'assistant' && m.plan && m.plan.length > 1 && (
                  <ol className="ai-plan">
                    {m.plan.map((step, j) => (
                      <li key={j}>{step}</li>
                    ))}
                  </ol>
                )}
                {m.role === 'assistant' && !!m.actions?.length && (
                  <div className={`ai-step ${m.status ?? 'pending'}`}>
                    <div className="ai-step-head">
                      {m.status === 'applied'
                        ? 'Шаг применён'
                        : m.status === 'skipped'
                          ? 'Шаг пропущен'
                          : 'Предлагаю шаг — проверьте'}
                    </div>
                    <ul className="ai-step-list">
                      {m.actions.map((action, k) => (
                        <li key={k}>{describeAction(action, doc)}</li>
                      ))}
                    </ul>
                    {m.status === 'pending' || !m.status ? (
                      <div className="ai-step-btns">
                        <button className="btn primary sm" onClick={() => applyEntry(i)}>
                          Применить шаг
                        </button>
                        <button className="btn ghost sm" onClick={() => skipEntry(i)}>
                          Пропустить
                        </button>
                      </div>
                    ) : m.status === 'applied' && i === messages.length - 1 ? (
                      <button
                        className="ai-continue"
                        onClick={() => void send('Продолжай план — следующий шаг.')}
                        disabled={busy}
                      >
                        Продолжить →
                      </button>
                    ) : null}
                    {m.note && <span className="ai-note">Применено: {m.note}</span>}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="ai-msg assistant">
                <div className="ai-bubble thinking">Думаю…</div>
              </div>
            )}
            {error && (
              <div className="ai-error">
                <strong>Не получилось.</strong> {error}
              </div>
            )}
          </div>

          <div className="ai-composer">
            <textarea
              rows={2}
              value={input}
              placeholder="Например: хочу сайт для кофейни — что предложишь?"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <button
              className="btn primary"
              disabled={busy || !input.trim() || !ready}
              onClick={() => void send(input)}
            >
              {busy ? '…' : 'Отправить'}
            </button>
          </div>
          <p className="hint">
            {provider.id === 'pollinations'
              ? 'Pollinations работает без ключа, но отвечает медленнее и может ошибаться в сложных задачах.'
              : 'Запросы идут напрямую выбранному провайдеру из вашего браузера.'}
          </p>
        </>
      )}
    </div>
  );
}
