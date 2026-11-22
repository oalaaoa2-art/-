import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AI_PROVIDERS,
  askAi,
  loadAiConfig,
  providerById,
  saveAiConfig,
  type AiAction,
  type AiConfig,
  type AiProviderId,
  type ChatMessage,
} from './ai';
import type { SiteDoc } from './types';

type Entry = ChatMessage & { note?: string };

const QUICK = [
  'Сделай лендинг кофейни',
  'Добавь страницу «О нас» с командой',
  'Сделай все блоки чуть уже и с фоном',
  'Перепиши тексты первого экрана короче',
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
      apiKey: id === prev.provider ? prev.apiKey : prev.apiKey,
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
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setBusy(true);
    try {
      const result = await askAi(config, doc, history, prompt);
      let note = '';
      if (result.actions.length) note = onActions(result.actions);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply || (result.actions.length ? 'Готово — изменил сайт.' : 'Не понял задачу. Сформулируйте иначе.'),
          note: note || undefined,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-head">
        <div className="ai-title">
          <span className="ai-mark">✦</span>
          <span>ИИ-помощник</span>
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
            <button className="mini" title="Сменить модель" onClick={() => setSetup(true)}>
              ⚙
            </button>
          </div>

          <div className="ai-chat" ref={chatRef}>
            {messages.length === 0 && (
              <div className="ai-empty">
                <p>
                  Напишите, что сделать с сайтом. Помощник может добавлять блоки и страницы, править тексты,
                  менять размеры, фон и тему — всё отменяется через Ctrl+Z.
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
                {m.note && <span className="ai-note">Применено: {m.note}</span>}
              </div>
            ))}
            {busy && <div className="ai-msg assistant"><div className="ai-bubble thinking">Думаю…</div></div>}
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
              placeholder="Например: сделай шапку и первый экран для студии дизайна"
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
