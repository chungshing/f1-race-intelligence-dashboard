'use client';

import { useEffect, useState } from 'react';
import { getPaceConsistency, PaceConsistencyRow } from '@/lib/app';

interface PaceConsistencyCardProps {
    sessionKey: number;
    // Synced with your precise lookup configuration shape structure
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
}

export function PaceConsistencyCard({ sessionKey, lookup }: PaceConsistencyCardProps) {
    const [consistency, setConsistency] = useState<PaceConsistencyRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPaceConsistency(sessionKey).then((data) => {
            const sorted = data.sort((a, b) => a.lapVariance - b.lapVariance);
            setConsistency(sorted);
            setLoading(false);
        });
    }, [sessionKey]);

    const formatLapTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const rem = (secs % 60).toFixed(3);
        return mins > 0 ? `${mins}:${Number(rem) < 10 ? '0' : ''}${rem}` : `${rem}s`;
    };

    if (loading || consistency.length === 0) return null;

    return (
        <div className='bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md space-y-4'>
            <div>
                <h3 className='text-sm font-black text-white uppercase tracking-wider'>
                    Race Pace Consistency
                </h3>
                <p className='text-[11px] text-zinc-500'>
                    Ranked by lowest lap time variability (Standard Deviation) during green flags
                </p>
            </div>

            {/* Structured fixed height max constraints matching the 6 rows viewport layout */}
            <div className='space-y-2 max-h-83.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent'>
                {consistency.map((driverRow, index) => {
                    const driver = lookup[driverRow.driverNumber] || {
                        name: `Driver ${driverRow.driverNumber}`,
                        team: 'F1',
                        teamColor: '#3f3f46',
                    };
                    return (
                        <div
                            key={driverRow.driverNumber}
                            className='flex items-center justify-between p-2.5 bg-zinc-900/40 border border-zinc-900 rounded-lg hover:border-zinc-800 transition-all'
                        >
                            <div className='flex items-center gap-3 min-w-0'>
                                <span className='font-mono font-bold text-[10px] text-zinc-500 w-4 shrink-0'>
                                    #{index + 1}
                                </span>
                                <div
                                    className='w-1 h-4 rounded-full shrink-0'
                                    style={{ backgroundColor: driver.teamColor }}
                                />
                                <div className='min-w-0 truncate'>
                                    <p className='text-xs font-bold text-white truncate'>
                                        {driver.name}
                                    </p>
                                    <p className='text-[10px] text-zinc-500 font-medium font-mono'>
                                        Avg: {formatLapTime(driverRow.averageLapTime)}
                                    </p>
                                </div>
                            </div>
                            <div className='text-right shrink-0 pl-2'>
                                <p className='text-xs font-mono font-black text-emerald-400'>
                                    ±{driverRow.lapVariance.toFixed(3)}s
                                </p>
                                <p className='text-[9px] font-bold text-zinc-500 uppercase tracking-wider'>
                                    Variation
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
