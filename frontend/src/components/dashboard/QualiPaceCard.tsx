'use client';

import { buildQualiPace } from '@/lib/qualiPace';
import { SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { Gauge } from 'lucide-react';
import { useMemo, useState } from 'react';

type Range = 'season' | 'recent';

const RECENT_RACES = 5;

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

interface Props {
    rows: SupabaseRaceResultRow[];
    drivers: DriverStanding[];
    meetingOrder: number[];
}

export function QualiPaceCard({ rows, drivers, meetingOrder }: Props) {
    const [range, setRange] = useState<Range>('season');

    const pace = useMemo(
        () =>
            buildQualiPace(rows, drivers, meetingOrder, range === 'recent' ? RECENT_RACES : undefined),
        [rows, drivers, meetingOrder, range]
    );

    if (pace.length === 0) return null;

    const maxGap = Math.max(...pace.map((t) => t.avgGapPct), 0.01);

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                    <Gauge className='w-4 h-4 text-zinc-400' />
                    <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                        Qualifying Pace
                    </h3>
                    <span className='text-[10px] font-medium text-zinc-400'>
                        Average gap to pole
                    </span>
                </div>

                <div className='flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-full sm:max-w-56'>
                    {(
                        [
                            { key: 'season' as const, label: 'Season' },
                            { key: 'recent' as const, label: `Last ${RECENT_RACES}` },
                        ] as const
                    ).map((option) => (
                        <button
                            key={option.key}
                            onClick={() => setRange(option.key)}
                            className={`flex-1 py-1 text-[11px] font-bold uppercase rounded-md transition-all ${
                                range === option.key
                                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                                    : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className='p-4 space-y-3'>
                {pace.map((team, index) => {
                    const width = Math.max(2, (team.avgGapPct / maxGap) * 100);
                    return (
                        <div key={team.teamName} className='space-y-1'>
                            <div className='flex items-center justify-between gap-3'>
                                <div className='flex items-center gap-2.5 min-w-0'>
                                    <span className='font-mono text-[11px] text-zinc-400 w-5 tabular-nums'>
                                        {index + 1}
                                    </span>
                                    <p className='text-xs font-semibold text-zinc-200 truncate'>
                                        {team.teamName}
                                    </p>
                                </div>
                                <span className='font-mono text-xs font-bold text-zinc-100 tabular-nums shrink-0'>
                                    +{team.avgGapPct.toFixed(2)}%
                                </span>
                            </div>
                            <div className='h-1.5 rounded-full bg-zinc-900'>
                                <div
                                    className='h-1.5 rounded-full'
                                    style={{
                                        width: `${width}%`,
                                        backgroundColor: toHex(team.teamColor),
                                        opacity: 0.8,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className='px-4 py-3 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed'>
                Each driver&apos;s best qualifying lap against pole, as a percentage of the pole
                time, averaged across the team&apos;s drivers. Drivers knocked out early set their
                lap in an earlier session, so treat gaps as a rough guide.
            </p>
        </div>
    );
}
