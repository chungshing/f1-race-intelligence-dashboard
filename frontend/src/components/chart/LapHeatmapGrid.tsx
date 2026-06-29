'use client';

import React, { useEffect, useState } from 'react';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';
import { buildSessionHeatmap, HeatmapDriverRow } from '@/utils/telemetry';
import { getLapsBySession } from '@/lib/app';
import { DriverResult } from '@/types/results';

const TELEMETRY_COLORS: Record<number, { bg: string; label: string }> = {
    2051: { bg: 'bg-purple-600', label: 'Session Best' },
    2049: { bg: 'bg-emerald-500', label: 'Personal Best' },
    2050: { bg: 'bg-zinc-600', label: 'No Improvement' },
    2048: { bg: 'bg-amber-500', label: 'Yellow Flag' },
    2064: { bg: 'bg-blue-800', label: 'Pitlane' },
    2068: { bg: 'bg-red-600', label: 'Stopped / Retired' },
    0: { bg: 'bg-zinc-900', label: 'No Data' },
};

const LEGEND = [2051, 2049, 2050, 2048, 2064, 2068] as const;

interface Props {
    sessionKey: number;
    driversList: DriverResult[];
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
}

export function LapHeatmapGrid({ sessionKey, driversList, lookup }: Props) {
    const [rows, setRows] = useState<HeatmapDriverRow[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!sessionKey) return;
        let isMounted = true;

        queueMicrotask(() => {
            if (isMounted) setLoading(true);
        });

        getLapsBySession(sessionKey)
            .then((raw) => {
                if (isMounted) setRows(buildSessionHeatmap(raw));
            })
            .catch(console.error)
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [sessionKey]);

    const finishOrder = driversList.map((d) => d.driverNumber);
    const sortedRows = [...rows].sort(
        (a, b) => finishOrder.indexOf(a.driverNumber) - finishOrder.indexOf(b.driverNumber),
    );

    const totalLaps = Math.max(0, ...rows.flatMap((r) => r.laps.map((l) => l.lapNumber)));

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Mini-Sector Heatmap
                </h3>
                <span className='text-[10px] text-zinc-600 font-medium uppercase tracking-wider'>
                    Worst  segment per lap
                </span>
            </div>

            <div className='p-4 space-y-4 overflow-x-auto'>
                {loading ? (
                    <div className='text-center py-6 text-zinc-600 text-[10px] font-bold tracking-wider uppercase animate-pulse'>
                        Building Heatmap...
                    </div>
                ) : (
                    <div className='min-w-max space-y-0.75'>
                        {/* Lap axis */}
                        <div className='flex items-center gap-0.5 mb-1 pl-22'>
                            {Array.from({ length: totalLaps }, (_, i) => i + 1).map((lap) => (
                                <div
                                    key={lap}
                                    className='w-2.5 text-center text-[8px] text-zinc-700 font-mono shrink-0'
                                >
                                    {lap % 5 === 0 ? lap : ''}
                                </div>
                            ))}
                        </div>

                        {/* Driver rows */}
                        {sortedRows.map(({ driverNumber, laps }) => {
                            const driver = lookup[driverNumber];
                            const lapMap = new Map(laps.map((l) => [l.lapNumber, l.bestCode]));

                            return (
                                <div key={driverNumber} className='flex items-center gap-0.5'>
                                    <div className='w-22 flex items-center gap-1.5 shrink-0 pr-2'>
                                        <span
                                            className='w-1 h-3 rounded-sm shrink-0'
                                            style={{
                                                backgroundColor: driver?.teamColor ?? '#52525b',
                                            }}
                                        />
                                        <span className='text-[10px] font-bold text-zinc-300 truncate'>
                                            {driver?.name ?? `#${driverNumber}`}
                                        </span>
                                    </div>

                                    {Array.from({ length: totalLaps }, (_, i) => i + 1).map(
                                        (lap) => {
                                            const code = lapMap.get(lap) ?? 0;
                                            const config =
                                                TELEMETRY_COLORS[code] ?? TELEMETRY_COLORS[0];
                                            return (
                                                <div
                                                    key={lap}
                                                    className={`w-2.5 h-3.5 rounded-xs shrink-0 cursor-default ${config.bg}`}
                                                    title={`${driver?.name ?? driverNumber} · Lap ${lap} · ${config.label}`}
                                                />
                                            );
                                        },
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Legend */}
                <div className='flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-zinc-900/40'>
                    {LEGEND.map((code) => (
                        <div
                            key={code}
                            className='flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider'
                        >
                            <span
                                className={`w-2.5 h-2.5 rounded-sm shrink-0 ${TELEMETRY_COLORS[code].bg}`}
                            />
                            <span className='text-zinc-500'>{TELEMETRY_COLORS[code].label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
