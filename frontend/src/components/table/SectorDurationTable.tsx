'use client';

import React, { useEffect, useState } from 'react';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { getLapsBySession } from '@/lib/app';
import { buildSectorBests, DriverSectorBests } from '@/utils/sectors';
import { DriverResult } from '@/types/results';

interface Props {
    sessionKey: number;
    driversList: DriverResult[];
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
}

function fmt(val: number | null): string {
    if (val === null) return '—';
    return val.toFixed(3);
}

export function SectorDurationTable({ sessionKey, driversList, lookup }: Props) {
    const [rows, setRows] = useState<DriverSectorBests[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sessionKey) return;
        let isMounted = true;

        queueMicrotask(() => {
            if (isMounted) setLoading(true);
        });

        getLapsBySession(sessionKey)
            .then((raw) => {
                if (isMounted) setRows(buildSectorBests(raw));
            })
            .catch(console.error)
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [sessionKey]);

    // Sort by finish order
    const finishOrder = driversList.map((d) => d.driverNumber);
    const sortedRows = [...rows].sort(
        (a, b) => finishOrder.indexOf(a.driverNumber) - finishOrder.indexOf(b.driverNumber),
    );

    // Best time per sector for highlighting
    const bestS1 = Math.min(...rows.map((r) => r.s1 ?? Infinity));
    const bestS2 = Math.min(...rows.map((r) => r.s2 ?? Infinity));
    const bestS3 = Math.min(...rows.map((r) => r.s3 ?? Infinity));

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Sector Duration Bests
                </h3>
                <span className='text-[10px] text-zinc-600 font-medium uppercase tracking-wider'>
                    Best sector time per driver
                </span>
            </div>

            <div className='overflow-x-auto overflow-y-auto max-h-83.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent'>
                {loading ? (
                    <div className='text-center py-6 text-zinc-600 text-[10px] font-bold tracking-wider uppercase animate-pulse'>
                        Calculating Sector Bests...
                    </div>
                ) : (
                    <table className='w-full text-xs'>
                        <thead>
                            <tr className='border-b border-zinc-900'>
                                <th className='text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-8'>
                                    P
                                </th>
                                <th className='text-left py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>
                                    Driver
                                </th>
                                {['S1', 'S2', 'S3'].map((s) => (
                                    <th
                                        key={s}
                                        className='text-right py-2.5 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider'
                                    >
                                        {s}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.map(({ driverNumber, s1, s2, s3 }, idx) => {
                                const driver = lookup[driverNumber];
                                const isS1Best = s1 !== null && s1 === bestS1;
                                const isS2Best = s2 !== null && s2 === bestS2;
                                const isS3Best = s3 !== null && s3 === bestS3;

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
                                                        backgroundColor:
                                                            driver?.teamColor ?? '#52525b',
                                                    }}
                                                />
                                                <span className='font-bold text-zinc-200'>
                                                    {driver?.name ?? `#${driverNumber}`}
                                                </span>
                                            </div>
                                        </td>
                                        {[
                                            { val: s1, best: isS1Best },
                                            { val: s2, best: isS2Best },
                                            { val: s3, best: isS3Best },
                                        ].map(({ val, best }, i) => (
                                            <td
                                                key={i}
                                                className={`py-2.5 px-4 text-right font-mono font-bold ${
                                                    best ? 'text-purple-400' : 'text-zinc-400'
                                                }`}
                                            >
                                                {fmt(val)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
