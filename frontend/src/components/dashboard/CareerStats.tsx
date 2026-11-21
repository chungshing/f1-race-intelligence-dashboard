'use client';

import { useDriverCareer } from '@/hooks/useDriverCareer';

const STAT_CARD = 'rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5';
const STAT_LABEL = 'text-[10px] font-bold uppercase tracking-wider text-zinc-400';
const STAT_VALUE = 'mt-1 font-mono text-3xl font-bold text-zinc-100';

export function CareerStats({ driverName }: { driverName: string }) {
    const { data, isPending, isError } = useDriverCareer(driverName);

    if (isError) return null;

    const tiles = [
        { label: 'Titles', value: data?.titles },
        { label: 'Wins', value: data?.wins },
        { label: 'Poles', value: data?.poles },
        { label: 'Podiums', value: data?.podiums },
        { label: 'Race starts', value: data?.starts },
    ];

    return (
        <div>
            <h3 className='mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400'>
                Career
            </h3>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
                {tiles.map((tile) => (
                    <div key={tile.label} className={STAT_CARD}>
                        <p className={STAT_LABEL}>{tile.label}</p>
                        {isPending ? (
                            <div className='mt-2 h-9 w-14 animate-pulse rounded bg-zinc-800/60' />
                        ) : (
                            <h2 className={STAT_VALUE}>{tile.value ?? '—'}</h2>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
