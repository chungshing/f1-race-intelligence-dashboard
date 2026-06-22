'use client';

import { PitStop, Stint, DriverResult } from '@/types/results';
import { Fuel, Timer, ArrowRight, History } from 'lucide-react';
import { TABLE_CONTAINER_CLASS } from '@/utils/styles';

interface Props {
    pitStops: PitStop[];
    stints: Stint[];
    results: DriverResult[];
    lookup: Record<number, { name: string; team: string; teamColor: string }>;
}

export const RaceStrategyTable = ({ pitStops, stints, results, lookup }: Props) => {
    const driverNumbers = Array.from(new Set(stints.map((s) => s.driver_number)));

    const driversStrategy = driverNumbers
        .map((driverNum) => {
            const info = lookup[driverNum] ?? {
                name: `Driver ${driverNum}`,
                team: 'Unknown',
                teamColor: '#3f3f46',
            };

            const match = results.find((r) => r.driverNumber === driverNum);

            let statusLabel = match?.position?.toString() || 'NC';
            if (match?.dnf) statusLabel = 'DNF';
            if (match?.dns) statusLabel = 'DNS';
            if (match?.dsq) statusLabel = 'DSQ';

            let sortWeight = match?.position ?? 900;
            if (match?.dnf) sortWeight = 910;
            if (match?.dsq) sortWeight = 920;
            if (match?.dns) sortWeight = 930;

            const driverStints = stints
                .filter((s) => s.driver_number === driverNum)
                .sort((a, b) => a.stint_number - b.stint_number);

            const driverPits = pitStops
                .filter((p) => p.driver_number === driverNum)
                .sort((a, b) => a.lap_number - b.lap_number);

            return {
                driverNum,
                info,
                statusLabel,
                sortWeight,
                stints: driverStints,
                pits: driverPits,
            };
        })
        .sort((a, b) => a.sortWeight - b.sortWeight);

    const getCompoundStyles = (compound: string) => {
        const c = compound?.toUpperCase() || '';
        if (c.includes('SOFT')) return 'bg-red-600/10 text-red-500 border-red-500/30';
        if (c.includes('MEDIUM')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
        if (c.includes('HARD')) return 'bg-zinc-100/10 text-zinc-300 border-zinc-500/30';
        if (c.includes('INTERMEDIATE')) return 'bg-green-600/10 text-green-500 border-green-500/30';
        if (c.includes('WET')) return 'bg-blue-600/10 text-blue-500 border-blue-500/30';
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    };

    return (
        <div className={TABLE_CONTAINER_CLASS}>
            <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center gap-2'>
                <History className='w-4 h-4 text-zinc-500' />
                <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                    Tire & Pit Strategies
                </h3>
            </div>

            <div className='divide-y divide-zinc-900'>
                {driversStrategy.map(
                    ({ driverNum, info, statusLabel, stints: driverStints, pits }) => (
                        <div
                            key={driverNum}
                            className='flex flex-col lg:flex-row lg:items-center p-4 pl-5 gap-6 hover:bg-zinc-900/30 transition-colors group'
                            style={{ borderLeft: `4px solid ${info.teamColor}` }}
                        >
                            {/* Position Pin & Profile */}
                            <div className='w-36 shrink-0 flex items-center gap-3'>
                                <div className='w-6 h-5 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-center shrink-0'>
                                    <span
                                        className={`text-[8px] font-mono font-bold ${
                                            ['DNF', 'DNS', 'DSQ'].includes(statusLabel)
                                                ? 'text-red-400/90'
                                                : 'text-zinc-400'
                                        }`}
                                    >
                                        {statusLabel}
                                    </span>
                                </div>
                                <div className='space-y-0.5 min-w-0 leading-tight'>
                                    <h4 className='font-bold text-zinc-200 text-xs tracking-tight truncate max-w-23.75'>
                                        {info.name}
                                    </h4>
                                    <div className='text-zinc-500 text-[10px] font-mono font-bold leading-none'>
                                        #{driverNum}
                                    </div>
                                    <p className='text-[9px] text-zinc-500 truncate leading-none'>
                                        {info.team}
                                    </p>
                                </div>
                            </div>

                            {/* Strategy Sequence Line */}
                            <div className='flex flex-wrap items-center gap-y-4 gap-x-2 grow'>
                                {driverStints.map((stint, idx) => {
                                    const matchingPit = pits[idx];
                                    const hasNextStint = idx < driverStints.length - 1;
                                    const totalLaps = stint.lap_end - stint.lap_start + 1;

                                    return (
                                        <div
                                            key={stint.stint_number}
                                            className='flex items-center gap-2'
                                        >
                                            {/* Stint Card */}
                                            <div className='flex items-center bg-zinc-900/40 border border-zinc-700/60 rounded-lg p-2 h-11.5 w-40 shrink-0 shadow-sm justify-between'>
                                                <div className='flex items-center min-w-0 overflow-hidden'>
                                                    <span
                                                        className={`text-[9px] font-black px-1.5 py-0.5 rounded border tracking-wider mr-2 uppercase shrink-0 ${getCompoundStyles(
                                                            stint.compound,
                                                        )}`}
                                                    >
                                                        {stint.compound?.charAt(0) || 'S'}
                                                    </span>
                                                    <div className='text-xs font-mono whitespace-nowrap truncate text-zinc-300 font-bold'>
                                                        Laps {stint.lap_start}–{stint.lap_end}
                                                    </div>
                                                </div>
                                                <span className='text-zinc-500 font-mono text-[10px] shrink-0 ml-1'>
                                                    {totalLaps}L
                                                </span>
                                            </div>

                                            {/* Pit Interval Box */}
                                            {matchingPit && (
                                                <div className='flex items-center gap-2 h-11.5 shrink-0'>
                                                    <ArrowRight className='w-4 h-4 text-zinc-500 stroke-[2.5]' />

                                                    <div className='flex flex-col bg-zinc-950/70 border border-zinc-700/60 rounded-lg w-25 h-full justify-between py-1.5 px-2 shadow-sm'>
                                                        <span className='text-[8px] font-bold text-red-400/90 uppercase tracking-wider flex items-center gap-1 shrink-0'>
                                                            <Fuel className='w-2.5 h-2.5 text-red-500' />
                                                            Lap {matchingPit.lap_number} Pit
                                                        </span>

                                                        <div className='space-y-0.5 font-mono text-[9px] w-full leading-none'>
                                                            <div className='flex justify-between items-center text-zinc-400'>
                                                                <span className='flex items-center gap-0.5'>
                                                                    <Timer className='w-2 h-2 text-zinc-500' />{' '}
                                                                    Stop:
                                                                </span>
                                                                <span className='font-bold text-zinc-200 tabular-nums'>
                                                                    {matchingPit.stop_duration
                                                                        ? `${matchingPit.stop_duration.toFixed(2)}s`
                                                                        : '—'}
                                                                </span>
                                                            </div>
                                                            <div className='flex justify-between items-center text-zinc-400'>
                                                                <span className='flex items-center gap-0.5'>
                                                                    <Timer className='w-2 h-2 text-zinc-500' />{' '}
                                                                    Lane:
                                                                </span>
                                                                <span className='font-bold text-zinc-300 tabular-nums'>
                                                                    {matchingPit.lane_duration
                                                                        ? `${matchingPit.lane_duration.toFixed(2)}s`
                                                                        : '—'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Conditional tracking arrow to prevent redundant endings */}
                                                    {hasNextStint && (
                                                        <ArrowRight className='w-4 h-4 text-zinc-500 stroke-[2.5]' />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ),
                )}
            </div>
        </div>
    );
};
