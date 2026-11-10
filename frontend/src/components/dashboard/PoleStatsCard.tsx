'use client';

import { Card, CardHeader, CardNote } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PoleSummary } from '@/lib/poles';
import { SCROLL_PANEL_CLASS } from '@/utils/styles';
import { Medal } from 'lucide-react';
import { useState } from 'react';

type View = 'drivers' | 'teams';

const VIEWS: { key: View; label: string }[] = [
    { key: 'drivers', label: 'Drivers' },
    { key: 'teams', label: 'Teams' },
];

const TH = 'py-2.5 px-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider';

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

export function PoleStatsCard({ summary }: { summary: PoleSummary }) {
    const [view, setView] = useState<View>('drivers');

    const rows = view === 'drivers' ? summary.drivers : summary.teams;
    if (summary.drivers.length === 0) return null;

    return (
        <Card>
            <CardHeader
                icon={Medal}
                title='Poles vs Wins'
                subtitle={
                    summary.racesCompared > 0
                        ? `Pole-sitter won ${summary.poleSitterWon} of ${summary.racesCompared} races`
                        : undefined
                }
                right={
                    <SegmentedControl
                        options={VIEWS}
                        value={view}
                        onChange={setView}
                        label='Poles view'
                        className='w-full sm:w-auto'
                    />
                }
            />

            <div className={SCROLL_PANEL_CLASS}>
                <table className='w-full text-xs'>
                    <thead>
                        <tr className='border-b border-zinc-900'>
                            <th className='py-2.5 px-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                {view === 'drivers' ? 'Driver' : 'Team'}
                            </th>
                            <th className={TH}>Poles</th>
                            <th className={TH}>Wins</th>
                            <th className={TH}>From pole</th>
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

            <CardNote>
                Pole is the fastest Qualifying time, whatever the final grid. Conversion is wins
                from pole divided by poles.
            </CardNote>
        </Card>
    );
}
