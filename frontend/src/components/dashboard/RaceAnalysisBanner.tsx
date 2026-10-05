'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, X, Activity } from 'lucide-react';

interface Props {
    meetingKey: number;
    countryName: string;
    sessionName: string;
}

export function RaceAnalysisBanner({ meetingKey, countryName, sessionName }: Props) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className='relative flex items-center justify-between gap-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl'>
            <div className='flex items-center gap-3 min-w-0'>
                <div className='shrink-0 w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center'>
                    <Activity className='w-3.5 h-3.5 text-red-400' />
                </div>
                <div className='min-w-0'>
                    <p className='text-xs font-bold text-red-400 uppercase tracking-wider'>
                        Post-Race Analysis Available
                    </p>
                    <p className='text-[11px] text-zinc-400 mt-0.5 truncate'>
                        Full telemetry and performance data for the{' '}
                        <span className='text-zinc-200 font-semibold'>
                            {countryName} {sessionName}
                        </span>{' '}
                        is now available.
                    </p>
                </div>
            </div>

            <div className='flex items-center gap-2 shrink-0'>
                <Link
                    href={`/races/${meetingKey}`}
                    className='flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors whitespace-nowrap'
                >
                    View Analysis <ChevronRight className='w-3.5 h-3.5' />
                </Link>
                <button
                    onClick={() => setDismissed(true)}
                    aria-label='Dismiss notification'
                    className='text-zinc-400 hover:text-zinc-200 transition-colors'
                >
                    <X className='w-3.5 h-3.5' />
                </button>
            </div>
        </div>
    );
}
