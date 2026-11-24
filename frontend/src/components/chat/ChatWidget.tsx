'use client';

import { MessageCircle, Send, SquarePen, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'assistant';
    text: string;
    isError?: boolean;
}

const SUGGESTIONS = [
    'Why didn’t Verstappen win the last race?',
    'Who gained the most places last race?',
    'Will it rain at the next race?',
    'How are Ferrari doing this season?',
];

const MARKDOWN: Components = {
    p: ({ children }) => <p className='my-1.5 first:mt-0 last:mb-0'>{children}</p>,
    strong: ({ children }) => <strong className='font-bold text-white'>{children}</strong>,
    em: ({ children }) => <em className='italic'>{children}</em>,
    ul: ({ children }) => <ul className='my-1.5 list-disc space-y-1 pl-5'>{children}</ul>,
    ol: ({ children }) => <ol className='my-1.5 list-decimal space-y-1 pl-5'>{children}</ol>,
    li: ({ children }) => <li className='pl-0.5'>{children}</li>,
    h1: ({ children }) => <h3 className='mb-1 mt-3 text-sm font-bold text-white'>{children}</h3>,
    h2: ({ children }) => <h3 className='mb-1 mt-3 text-sm font-bold text-white'>{children}</h3>,
    h3: ({ children }) => <h4 className='mb-1 mt-2 text-sm font-bold text-white'>{children}</h4>,
    code: ({ children }) => (
        <code className='rounded bg-zinc-950 px-1 py-0.5 font-mono text-[12px] text-zinc-200'>
            {children}
        </code>
    ),
    a: ({ children, href }) => (
        <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className='text-red-400 underline underline-offset-2 hover:text-red-300'
        >
            {children}
        </a>
    ),
    table: ({ children }) => (
        <div className='my-2 overflow-x-auto rounded-lg border border-zinc-700'>
            <table className='w-full border-collapse text-xs'>{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className='bg-zinc-900'>{children}</thead>,
    th: ({ children }) => (
        <th className='border-b border-zinc-700 px-2 py-1.5 text-left font-bold text-zinc-200'>
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className='border-b border-zinc-800 px-2 py-1.5 text-zinc-300'>{children}</td>
    ),
};

function BotAvatar() {
    return (
        <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white'>
            F1
        </span>
    );
}

function Thinking() {
    return (
        <div className='flex items-start gap-2'>
            <BotAvatar />
            <div
                className='w-56 space-y-2 rounded-2xl rounded-tl-sm bg-zinc-800 px-3.5 py-3'
                role='status'
                aria-label='Analysing the data'
            >
                <div className='h-2.5 w-full animate-pulse rounded bg-zinc-700' />
                <div className='h-2.5 w-4/5 animate-pulse rounded bg-zinc-700' />
                <div className='h-2.5 w-3/5 animate-pulse rounded bg-zinc-700' />
                <p className='pt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500'>
                    Analysing the data…
                </p>
            </div>
        </div>
    );
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, open]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const newChat = () => {
        setMessages([]);
        setInput('');
        setLoading(false);
        inputRef.current?.focus();
    };

    const send = async (text: string) => {
        const question = text.trim();
        if (!question || loading) return;

        const next: Message[] = [...messages, { role: 'user', text: question }];
        setMessages(next);
        setInput('');
        setLoading(true);

        try {
            // Errors are shown in the chat, but never sent back to the model as history.
            const history = next
                .filter((m) => !m.isError)
                .map(({ role, text }) => ({ role, text }));
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history }),
            });
            const data = await res.json();

            setMessages([
                ...next,
                data.reply
                    ? { role: 'assistant', text: data.reply }
                    : {
                          role: 'assistant',
                          text: data.error ?? 'Something went wrong.',
                          isError: true,
                      },
            ]);
        } catch {
            setMessages([
                ...next,
                { role: 'assistant', text: 'Request failed. Try again.', isError: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {open && (
                <div
                    role='dialog'
                    aria-label='Race analyst chat'
                    className='fixed inset-x-3 z-50 flex h-[min(36rem,75vh)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60 sm:inset-x-auto sm:right-4 sm:w-104'
                    style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
                >
                    <div className='flex items-center justify-between bg-linear-to-r from-red-700 to-red-600 px-4 py-3'>
                        <div className='flex items-center gap-2.5'>
                            <span className='flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[11px] font-black text-white'>
                                F1
                            </span>
                            <div>
                                <p className='text-sm font-bold leading-tight text-white'>
                                    Race Analyst
                                </p>
                                <p className='text-[11px] leading-tight text-red-100/80'>
                                    Ask about races, drivers and teams
                                </p>
                            </div>
                        </div>
                        <div className='flex items-center gap-1'>
                            <button
                                onClick={newChat}
                                disabled={messages.length === 0 && !loading}
                                aria-label='New chat'
                                title='New chat'
                                className='flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent'
                            >
                                <SquarePen className='h-3.5 w-3.5' />
                                New chat
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label='Close chat'
                                className='rounded-lg p-2 text-white transition-colors hover:bg-white/15'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        </div>
                    </div>

                    <div
                        role='log'
                        aria-live='polite'
                        className='flex-1 space-y-3 overflow-y-auto bg-zinc-900 px-3.5 py-4'
                    >
                        <div className='flex items-start gap-2'>
                            <BotAvatar />
                            <div className='max-w-[88%] rounded-2xl rounded-tl-sm bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100'>
                                <p>Hi! I&apos;m the race analyst for this dashboard.</p>
                                <p className='mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-200'>
                                    <strong className='font-bold'>Good to know:</strong> I only know
                                    this dashboard&apos;s data. I can&apos;t answer general F1
                                    questions, such as rules or history beyond what&apos;s here, and
                                    I won&apos;t make things up.
                                </p>
                            </div>
                        </div>

                        {messages.length === 0 && (
                            <div className='flex flex-wrap gap-2 pl-8'>
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className='rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-left text-xs text-red-100 transition-colors hover:bg-red-500/20'
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {messages.map((m, i) =>
                            m.role === 'user' ? (
                                <div
                                    key={i}
                                    className='ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-red-600 px-3.5 py-2 text-sm text-white'
                                >
                                    {m.text}
                                </div>
                            ) : (
                                <div key={i} className='flex items-start gap-2'>
                                    <BotAvatar />
                                    <div
                                        className={`max-w-[88%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm ${
                                            m.isError
                                                ? 'border border-red-500/40 bg-red-950/40 text-red-200'
                                                : 'bg-zinc-800 text-zinc-100'
                                        }`}
                                    >
                                        {m.isError ? (
                                            m.text
                                        ) : (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={MARKDOWN}
                                            >
                                                {m.text}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            )
                        )}

                        {loading && <Thinking />}
                        <div ref={bottomRef} />
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            send(input);
                        }}
                        className='flex gap-2 border-t border-zinc-700 bg-zinc-950 p-3'
                    >
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Ask about a race or driver…'
                            className='min-h-10 flex-1 rounded-full border border-zinc-600 bg-zinc-800 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none'
                        />
                        <button
                            type='submit'
                            disabled={loading || !input.trim()}
                            aria-label='Send'
                            className='flex min-h-10 min-w-10 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600'
                        >
                            <Send className='h-4 w-4' />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close race analyst' : 'Open race analyst'}
                className='fixed right-4 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-black/50 transition-colors hover:bg-red-500'
                style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
                {open ? <X className='h-5 w-5' /> : <MessageCircle className='h-5 w-5' />}
            </button>
        </>
    );
}
