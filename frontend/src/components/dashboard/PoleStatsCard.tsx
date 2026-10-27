'use client';

import { PoleSummary } from '@/lib/poles';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { Medal } from 'lucide-react';
import { useState } from 'react';

type View = 'drivers' | 'teams';

const TH = 'py-2.5 px-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider';

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

export function PoleStatsCard({ summary }: { summary: PoleSummary }) {
    const [view, setView] = useState<View>('drivers');

    const rows = view === 'drivers' ? summary.drivers : summary.teams;
    if (summary.drivers.length === 0) return null;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2 flex-wrap'>
                    <Medal className='w-4 h-4 text-zinc-400' />
                    <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                        Poles vs Wins
                    </h3>
                    {summary.racesCompared > 0 && (
                        <span className='text-[10px] font-medium text-zinc-400'>
                            Pole-sitter won {summary.poleSitterWon} of {summary.racesCompared} races
                        </span>
                    )}
                </div>

                <div className='flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-full sm:max-w-52'>
                    {(['drivers', 'teams'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setView(tab)}
                            className={`flex-1 py-1 text-[11px] font-bold uppercase rounded-md transition-all ${
                                view === tab
                                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                                    : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-xs'>
                    <thead>
                        <tr className='border-b border-zinc-900'>
                            <th className='py-2.5 px-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                {view === 'drivers' ? 'Driver' : 'Team'}
                            </th>
                            <th className={TH}>Poles</th>
                            <th className={TH}>Wins</th>
                            <th className={TH}>Wins from pole</th>
                            <th className={TH}>Conversion</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-zinc-900'>
                        {rows.map((row) => (
                            <tr key={row.key} className='hover:bg-zinc-900/50 transition-colors'>
                                <td className='py-2.5 px-4'>
                                    <div className='flex items-center gap-2.5 min-w-0'>
                                        <span
                                            className='w-1 h-4 rounded-full shrink-0'
                                            style={{ backgroundColor: toHex(row.teamColor) }}
                                        />
                                        <div className='min-w-0'>
                                            <p className='font-semibold text-zinc-200 truncate'>
                                                {row.name}
                                            </p>
                                            {view === 'drivers' && (
                                                <p className='text-[10px] text-zinc-400 truncate'>
                                                    {row.teamName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className='py-2.5 px-4 text-right font-mono font-bold text-zinc-100 tabular-nums'>
                                    {row.poles}
                                </td>
                                <td className='py-2.5 px-4 text-right font-mono text-zinc-300 tabular-nums'>
                                    {row.wins}
                                </td>
                                <td className='py-2.5 px-4 text-right font-mono text-zinc-300 tabular-nums'>
                                    {row.winsFromPole}
                                </td>
                                <td className='py-2.5 px-4 text-right font-mono text-zinc-400 tabular-nums'>
                                    {row.conversion != null
                                        ? `${Math.round(row.conversion * 100)}%`
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className='px-4 py-3 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed'>
                Pole is the fastest Qualifying time, whatever the final grid. Conversion is wins
                from pole divided by poles.
            </p>
        </div>
    );
}
