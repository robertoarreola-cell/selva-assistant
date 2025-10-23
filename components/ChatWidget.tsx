'use client';

import { useEffect, useRef, useState, Fragment, ReactNode } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
type ChatPayload = { answer: string };

/* Convierte URLs en <a target="_blank"> y evita overflow */
function Linkified({ text }: { text: string }) {
  // Captura http/https y evita que el ) final se ‘pegue’ al link
  const urlRegex = /(https?:\/\/[^\s()]+[^\s.(),!?)]?)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = urlRegex.exec(text)) !== null) {
    const url = m[0];
    const start = m.index;
    if (start > last) parts.push(<Fragment key={`t-${last}`}>{text.slice(last, start)}</Fragment>);
    parts.push(
      <a
        key={`a-${start}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-green-700 hover:text-green-800 break-all"
      >
        {url}
      </a>
    );
    last = start + url.length;
  }
  if (last < text.length) parts.push(<Fragment key={`t-end`}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Msg[]>([
    { role: 'assistant', content: 'Listo para ayudar, ¿qué buscas?' },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { role: 'user', content: text };
    setHistory((h) => [...h, userMsg]);
    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, conversation: history }),
      });
      const data: ChatPayload = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || 'Error en /api/chat');

      setHistory((h) => [...h, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      setHistory((h) => [
        ...h,
        {
          role: 'assistant',
          content:
            'Hubo un problema al responder. Revisa tu conexión e inténtalo de nuevo.',
        },
      ]);
      console.error('[ChatWidget] error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 rounded-full shadow-lg p-4 bg-green-600 text-white hover:bg-green-700 focus:outline-none"
        aria-label={open ? 'Cerrar chat Selva' : 'Abrir chat Selva'}
      >
        {open ? '✖️' : '💬'}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 max-h-[70vh] rounded-2xl shadow-xl bg-white border border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b text-sm font-semibold">Selva · Asistente</div>

          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {history.map((m, i) => (
              <div
                key={i}
                className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={[
                    'inline-block px-3 py-2 rounded-2xl max-w-full overflow-hidden',
                    'whitespace-pre-wrap break-words', // ← importante para URLs largas
                    m.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900',
                  ].join(' ')}
                >
                  {m.role === 'assistant' ? <Linkified text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500">pensando…</div>}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Escribe tu pregunta…"
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className="bg-green-600 text-white text-sm px-3 py-2 rounded-xl hover:bg-green-700 disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

