'use client';

import React from 'react';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { buildPitStopLeaderboard } from '@/utils/performace';
import { PitStop } from '@/types/results';
import { Timer } from 'lucide-react';

interface Props {
    pitStops: PitStop[];
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
}

export function PitStopLeaderboard({ pitStops, lookup }: Props) {
    const rows = buildPitStopLeaderboard(pitStops);

    if (!rows.length) return null;

    const bestOverall = rows[0].bestStop;

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Timer className='w-4 h-4 text-zinc-500' />
                    <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                        Pit Stop Leaderboard
                    </h3>
                </div>
                <span className='text-[10px] text-zinc-600 font-medium uppercase tracking-wider'>
                    Ranked by best stop
                </span>
            </div>

            <div className='overflow-x-auto overflow-y-auto max-h-83.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent'>
                <table className='w-full text-xs'>
                    <thead>
                        <tr className='border-b border-zinc-900'>
                            <th className='text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-8'>
                                P
                            </th>
                            <th className='text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>
                                Driver
                            </th>
                            <th className='text-right py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>
                                Best
                            </th>
                            <th className='text-right py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>
                                Avg
                            </th>
                            <th className='text-right py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>
                                Stops
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ driverNumber, bestStop, avgStop, totalStops }, idx) => {
                            const driver = lookup[driverNumber];
                            const isFastest = bestStop === bestOverall;

                            return (
                                <tr
                                    key={driverNumber}
                                    className='border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors'
                                >
                                    <td className='py-2.5 px-4 text-zinc-600 font-mono text-[10px]'>
                                        {idx + 1}
                                    </td>
                                    <td className='py-2.5 px-4'>
                                        <div className='flex items-center gap-2'>
                                            <span
                                                className='w-1 h-3.5 rounded-sm shrink-0'
                                                style={{
                                                    backgroundColor: driver?.teamColor ?? '#52525b',
                                                }}
                                            />
                                            <span className='font-bold text-zinc-200'>
                                                {driver?.name ?? `#${driverNumber}`}
                                            </span>
                                        </div>
                                    </td>
                                    <td
                                        className={`py-2.5 px-4 text-right font-mono font-bold ${isFastest ? 'text-purple-400' : 'text-zinc-400'}`}
                                    >
                                        {bestStop.toFixed(2)}s
                                    </td>
                                    <td className='py-2.5 px-4 text-right font-mono text-zinc-500'>
                                        {avgStop.toFixed(2)}s
                                    </td>
                                    <td className='py-2.5 px-4 text-right font-mono text-zinc-500'>
                                        {totalStops}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
