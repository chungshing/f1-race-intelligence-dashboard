'use client';

import AppLayout from '@/components/layout/AppLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

const SUGGESTIONS = [
    'Why didn’t Verstappen win in Brazil?',
    'Who gained the most places in the last race?',
    'Summarise the last race strategy',
];

export default function AskPage() {
    usePageTitle('Ask');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [adminToken, setAdminToken] = useState('');
    const [loading, setLoading] = useState(false);

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
        <AppLayout>
            <div className='space-y-5 text-zinc-100'>
                <div className='border-b border-zinc-800/40 pb-4'>
                    <h1 className='text-2xl font-bold'>Race Analyst</h1>
                    <p className='text-xs text-zinc-400 mt-1'>
                        Ask why a result happened. Answers come from the dashboard’s race data.
                    </p>
                </div>

                {messages.length === 0 && (
                    <div className='flex flex-wrap gap-2'>
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => send(s)}
                                className='min-h-9 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors'
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <div className='space-y-3'>
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`max-w-[90%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                                m.role === 'user'
                                    ? 'ml-auto bg-zinc-800 text-zinc-100'
                                    : 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-200'
                            }`}
                        >
                            {m.text}
                        </div>
                    ))}
                    {loading && (
                        <div className='h-12 w-40 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                    )}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        send(input);
                    }}
                    className='flex gap-2'
                >
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder='Why didn’t Norris win in Monaco?'
                        className='flex-1 min-h-10 px-3 text-sm bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600'
                    />
                    <button
                        type='submit'
                        disabled={loading || !input.trim()}
                        className='min-h-10 px-4 text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-900 rounded-lg disabled:opacity-40'
                    >
                        Ask
                    </button>
                </form>

                <input
                    type='password'
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    placeholder='Admin token (optional, enables “sync the data”)'
                    className='w-full min-h-9 px-3 text-xs bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400 placeholder:text-zinc-700 focus:outline-none'
                />
            </div>
        </AppLayout>
    );
}
