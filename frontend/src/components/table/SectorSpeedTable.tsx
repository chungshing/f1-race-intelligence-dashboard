'use client';

import { useEffect, useState } from 'react';
import { getLapsBySession } from '@/lib/app';
import { buildSectorSpeedLeaders, SectorSpeedLeader } from '@/utils/performace';

interface SectorSpeedTableProps {
    sessionKey: number;
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
}

export function SectorSpeedTable({ sessionKey, lookup }: SectorSpeedTableProps) {
    const [speeds, setSpeeds] = useState<SectorSpeedLeader[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;
        let isMounted = true;

        getLapsBySession(sessionKey)
            .then((raw) => {
                if (!isMounted) return;
                setSpeeds(
                    buildSectorSpeedLeaders(raw).sort(
                        (a, b) =>
                            Math.max(b.sector1Max, b.sector2Max, b.sector3Max) -
                            Math.max(a.sector1Max, a.sector2Max, a.sector3Max),
                    ),
                );
                setLoading(false);
            })
            .catch(console.error)
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [sessionKey]);

    if (loading)
        return (
            <div className='text-center py-6 text-zinc-600 text-[10px] font-bold tracking-wider uppercase animate-pulse'>
                Loading...
            </div>
        );

    return (
        <div className='bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md space-y-4 flex flex-col justify-between'>
            <div className='shrink-0'>
                <h3 className='text-sm font-black text-white uppercase tracking-wider'>
                    Speed Trap Leaders
                </h3>
                <p className='text-[11px] text-zinc-500'>
                    Maximum recorded trap speeds across track sectors in km/h
                </p>
            </div>

            {/* Height boosted to 334px to completely match the PaceConsistencyCard scale height */}
            <div className='overflow-x-auto overflow-y-auto max-h-83.5 border border-zinc-900 rounded-lg scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent flex-1 mt-1'>
                <table className='w-full text-left border-collapse text-xs table-fixed'>
                    <thead className='sticky top-0 z-10 bg-zinc-950'>
                        <tr className='bg-zinc-900/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800'>
                            <th className='p-2.5 pl-4 w-[40%]'>Driver</th>
                            <th className='p-2.5 text-center w-[20%]'>Sector 1</th>
                            <th className='p-2.5 text-center w-[20%]'>Sector 2</th>
                            <th className='p-2.5 text-center w-[20%]'>Sector 3 (ST)</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-zinc-900 text-zinc-300 font-medium'>
                        {speeds.map((row) => {
                            const driver = lookup[row.driverNumber] || {
                                name: `Driver ${row.driverNumber}`,
                                team: 'F1',
                                teamColor: '#3f3f46',
                            };
                            return (
                                <tr
                                    key={row.driverNumber}
                                    className='hover:bg-zinc-900/30 transition-colors'
                                >
                                    <td className='p-2.5 pl-4 flex items-center gap-2 truncate'>
                                        <div
                                            className='w-1 h-3.5 rounded-full shrink-0'
                                            style={{ backgroundColor: driver.teamColor }}
                                        />
                                        <span className='font-bold text-white truncate'>
                                            {driver.name}
                                        </span>
                                    </td>
                                    <td className='p-2.5 text-center font-mono'>
                                        {row.sector1Max || '-'}
                                    </td>
                                    <td className='p-2.5 text-center font-mono'>
                                        {row.sector2Max || '-'}
                                    </td>
                                    <td className='p-2.5 text-center font-mono text-blue-400 font-bold'>
                                        {row.sector3Max || '-'}
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
