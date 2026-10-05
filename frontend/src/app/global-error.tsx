/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang='en'>
            <body className='bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center'>
                <div className='flex flex-col items-center text-center space-y-4 px-4'>
                    <div className='w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center'>
                        <span className='text-red-400 text-xl font-bold'>!</span>
                    </div>
                    <div className='space-y-1.5'>
                        <p className='text-zinc-200 font-bold tracking-tight'>Application error</p>
                        <p className='text-zinc-400 text-xs leading-relaxed max-w-sm'>
                            Something went seriously wrong loading the app. Try refreshing the page.
                        </p>
                    </div>
                    <div className='flex items-center gap-3 pt-2'>
                        <button
                            onClick={() => reset()}
                            className='text-xs font-bold px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors'
                        >
                            Try Again
                        </button>
                        <a
                            href='/'
                            className='text-xs font-bold px-3 py-2 text-zinc-400 hover:text-zinc-200 transition-colors'
                        >
                            Reload Dashboard
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}
