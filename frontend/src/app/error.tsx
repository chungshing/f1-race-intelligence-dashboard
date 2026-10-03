/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
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
        <AppLayout>
            <div className='flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4'>
                <div className='w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center'>
                    <AlertTriangle className='w-5 h-5 text-red-400' />
                </div>
                <div className='space-y-1.5'>
                    <p className='text-zinc-200 font-bold tracking-tight'>Something went wrong</p>
                    <p className='text-zinc-400 text-xs leading-relaxed max-w-sm'>
                        This page hit an unexpected error. You can try again, or head back to the
                        dashboard.
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
                        Back to Dashboard
                    </a>
                </div>
            </div>
        </AppLayout>
    );
}
