'use client';

import { useDriverCareer } from '@/hooks/useDriverCareer';
import { formatHexColor } from '@/utils/sessions';
import { Crown, Flag, Medal, Timer, Trophy, type LucideIcon } from 'lucide-react';

const GOLD = '#fbbf24';

interface Tile {
    label: string;
    value: number | null | undefined;
    icon: LucideIcon;
    /** Share of race starts, 0 to 1. Only for wins, poles and podiums. */
    rate?: number | null;
    className?: string;
}

export function CareerStats({ driverName, teamColor }: { driverName: string; teamColor: string }) {
    const { data, isPending, isError } = useDriverCareer(driverName);
    const accent = formatHexColor(teamColor);

    if (isError) return null;

    const starts = data?.starts ?? null;
    const rateOf = (value: number | null | undefined) =>
        starts && value !== null && value !== undefined ? value / starts : null;

    const tiles: Tile[] = [
        { label: 'Titles', value: data?.titles, icon: Crown },
        { label: 'Wins', value: data?.wins, icon: Trophy, rate: rateOf(data?.wins) },
        { label: 'Poles', value: data?.poles, icon: Timer, rate: rateOf(data?.poles) },
        { label: 'Podiums', value: data?.podiums, icon: Medal, rate: rateOf(data?.podiums) },
        {
            label: 'Race starts',
            value: data?.starts,
            icon: Flag,
            className: 'col-span-2 sm:col-span-1',
        },
    ];

    return (
        <div>
            <h3 className='mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400'>
                Career
            </h3>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
                {tiles.map((tile) => {
                    const Icon = tile.icon;
                    const isChampion = tile.label === 'Titles' && (tile.value ?? 0) > 0;
                    const color = isChampion ? GOLD : accent;

                    return (
                        <div
                            key={tile.label}
                            className={`relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 ${tile.className ?? ''}`}
                            style={{
                                background: `linear-gradient(135deg, ${color}14, transparent 65%)`,
                                borderColor: isChampion ? `${GOLD}55` : undefined,
                            }}
                        >
                            <div className='flex items-center justify-between'>
                                <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                                    {tile.label}
                                </p>
                                <Icon
                                    className='h-3.5 w-3.5'
                                    style={{ color }}
                                    aria-hidden='true'
                                />
                            </div>

                            {isPending ? (
                                <div className='mt-2 h-9 w-14 animate-pulse rounded bg-zinc-800/60' />
                            ) : (
                                <h2
                                    className='mt-1 font-mono text-3xl font-bold'
                                    style={{ color: isChampion ? GOLD : '#f4f4f5' }}
                                >
                                    {tile.value ?? '—'}
                                </h2>
                            )}

                            {tile.rate !== undefined && (
                                <div className='mt-2'>
                                    <div className='h-1 overflow-hidden rounded-full bg-zinc-800'>
                                        <div
                                            className='h-full rounded-full'
                                            style={{
                                                width: `${Math.min((tile.rate ?? 0) * 100, 100)}%`,
                                                backgroundColor: accent,
                                            }}
                                        />
                                    </div>
                                    <p className='mt-1 font-mono text-[10px] text-zinc-500'>
                                        {tile.rate !== null
                                            ? `${(tile.rate * 100).toFixed(1)}% of starts`
                                            : '—'}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
