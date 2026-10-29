'use client';

import { PlacesGainedSummary } from '@/lib/placesGained';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { ArrowUpDown } from 'lucide-react';

const TH = 'py-2.5 px-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider';

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

function signed(value: number, digits = 0) {
    const text = value.toFixed(digits);
    return value > 0 ? `+${text}` : text;
}

function tone(value: number) {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return 'text-zinc-400';
}

export function PlacesGainedCard({ summary }: { summary: PlacesGainedSummary }) {
    if (summary.rows.length === 0) return null;

    const fallbackRaces = summary.racesCounted - summary.officialGridRaces;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2 flex-wrap'>
                <ArrowUpDown className='w-4 h-4 text-zinc-400' />
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Places Gained
                </h3>
                <span className='text-[10px] font-medium text-zinc-400'>
                    Grid to finish, {summary.racesCounted} races
                </span>
            </div>

            <div className='overflow-x-auto'>
                <table className='w-full text-xs'>
                    <thead>
                        <tr className='border-b border-zinc-900'>
                            <th className='py-2.5 px-4 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider'>
                                Driver
                            </th>
                            <th className={TH}>Net</th>
                            <th className={TH}>Per race</th>
                            <th className={TH}>Races</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-zinc-900'>
                        {summary.rows.map((row) => (
                            <tr
                                key={row.driverNumber}
                                className='hover:bg-zinc-900/50 transition-colors'
                            >
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
                                            <p className='text-[10px] text-zinc-400 truncate'>
                                                {row.teamName}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td
                                    className={`py-2.5 px-4 text-right font-mono font-bold tabular-nums ${tone(row.netPlaces)}`}
                                >
                                    {signed(row.netPlaces)}
                                </td>
                                <td
                                    className={`py-2.5 px-4 text-right font-mono tabular-nums ${tone(row.avgPlaces)}`}
                                >
                                    {signed(row.avgPlaces, 1)}
                                </td>
                                <td className='py-2.5 px-4 text-right font-mono text-zinc-400 tabular-nums'>
                                    {row.races}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className='px-4 py-3 border-t border-zinc-900 text-[10px] text-zinc-400 leading-relaxed'>
                Counts classified finishers only, so retirements don&apos;t count as places lost.
                Drivers who start near the front have less room to gain.
                {fallbackRaces > 0 &&
                    ` ${summary.officialGridRaces} of ${summary.racesCounted} races use the official starting grid; the other ${fallbackRaces} use qualifying positions.`}
            </p>
        </div>
    );
}
