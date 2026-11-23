'use client';

import { KeyRound, MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

const SUGGESTIONS = [
    'Why didn’t Verstappen win the last race?',
    'Who gained the most places last race?',
    'How is Norris’s season going?',
];

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [adminToken, setAdminToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const send = async (text: string) => {
        const question = text.trim();
        if (!question || loading) return;

        const next: Message[] = [...messages, { role: 'user', text: question }];
        setMessages(next);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: next, adminToken: adminToken || undefined }),
            });
            const data = await res.json();
            setMessages([
                ...next,
                { role: 'assistant', text: data.reply ?? data.error ?? 'Something went wrong.' },
            ]);
        } catch {
            setMessages([...next, { role: 'assistant', text: 'Request failed. Try again.' }]);
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
                    className='fixed inset-x-3 z-50 flex h-[min(34rem,70vh)] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:inset-x-auto sm:right-4 sm:w-96'
                    style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
                >
                    <div className='flex items-center justify-between border-b border-zinc-800 px-4 py-3'>
                        <div>
                            <p className='text-sm font-bold text-zinc-100'>Race Analyst</p>
                            <p className='text-[10px] text-zinc-500'>
                                Answers come from the dashboard’s data
                            </p>
                        </div>
                        <div className='flex items-center gap-1'>
                            <button
                                onClick={() => setShowToken((v) => !v)}
                                aria-label='Admin token'
                                className='rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300'
                            >
                                <KeyRound className='h-4 w-4' />
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label='Close chat'
                                className='rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        </div>
                    </div>

                    {showToken && (
                        <input
                            type='password'
                            value={adminToken}
                            onChange={(e) => setAdminToken(e.target.value)}
                            placeholder='Admin password (enables “sync the data”)'
                            className='border-b border-zinc-900 bg-zinc-950 px-4 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none'
                        />
                    )}

                    <div className='flex-1 space-y-3 overflow-y-auto px-4 py-3'>
                        {messages.length === 0 && (
                            <div className='flex flex-wrap gap-2'>
                                {SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => send(s)}
                                        className='rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-800'
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                                    m.role === 'user'
                                        ? 'ml-auto bg-zinc-800 text-zinc-100'
                                        : 'border border-zinc-800/60 bg-zinc-900/60 text-zinc-200'
                                }`}
                            >
                                {m.text}
                            </div>
                        ))}

                        {loading && (
                            <div className='h-9 w-24 animate-pulse rounded-xl border border-zinc-800/50 bg-zinc-900/40' />
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            send(input);
                        }}
                        className='flex gap-2 border-t border-zinc-800 p-3'
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Ask about a race or driver…'
                            className='min-h-10 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none'
                        />
                        <button
                            type='submit'
                            disabled={loading || !input.trim()}
                            aria-label='Send'
                            className='flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 disabled:opacity-40'
                        >
                            <Send className='h-4 w-4' />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close race analyst' : 'Open race analyst'}
                className='fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-xl transition-colors hover:bg-zinc-800'
                style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
                {open ? <X className='h-5 w-5' /> : <MessageCircle className='h-5 w-5' />}
            </button>
        </>
    );
}
