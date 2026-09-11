'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useState } from 'react';

export default function AdminSyncPage() {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleManualSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            const response = await fetch('/api/sync', { method: 'POST' });

            if (response.status === 202) {
                alert('Pipeline synchronization started successfully.');
                setTimeout(() => setIsSyncing(false), 5000);
            } else if (response.status === 401) {
                alert('Unauthorized: Invalid backend validation token.');
                setIsSyncing(false);
            } else if (response.status === 404) {
                alert('Sync endpoint not found. Check your API route.');
                setIsSyncing(false);
            } else {
                throw new Error(`Server returned status: ${response.status}`);
            }
        } catch (error) {
            console.warn('Backend unreachable, retrying in 60s...', error);
            setTimeout(() => {
                setIsSyncing(false);
                handleManualSync();
            }, 60000);
        }
    };

    return (
        <AppLayout>
            <div className='space-y-5 text-zinc-100'>
                <div className='mb-5 border-b border-zinc-800/40 pb-4'>
                    <h1 className='text-2xl font-bold text-zinc-100'>Admin — Sync</h1>
                    <p className='text-xs text-zinc-400 mt-1'>
                        Manual pipeline trigger. Use only if the scheduled sync has failed.
                    </p>
                </div>

                <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                        isSyncing
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-400 cursor-not-allowed'
                            : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 text-zinc-200 active:scale-95'
                    }`}
                >
                    {isSyncing ? (
                        <>
                            <svg
                                className='animate-spin h-3.5 w-3.5 text-zinc-400'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <circle
                                    className='opacity-25'
                                    cx='12'
                                    cy='12'
                                    r='10'
                                    stroke='currentColor'
                                    strokeWidth='4'
                                />
                                <path
                                    className='opacity-75'
                                    fill='currentColor'
                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                />
                            </svg>
                            Syncing Live Data...
                        </>
                    ) : (
                        <>
                            <svg
                                className='h-3.5 w-3.5'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 1121.253 8H18'
                                />
                            </svg>
                            Sync Session Data
                        </>
                    )}
                </button>
            </div>
        </AppLayout>
    );
}
