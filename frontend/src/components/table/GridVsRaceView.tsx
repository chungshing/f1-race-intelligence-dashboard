'use client';

import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react';
import { RaceResult } from '@/types/results';
import { TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS, getPositionColor } from '@/utils/styles';
import {
    GridRacePair,
    GridRaceRow,
    buildGridRaceRows,
    summarizeGridRace,
} from '@/utils/gridVsRace';

interface Lookup {
    name: string;
    team: string;
    teamColor: string;
}

interface Props {
    pairs: GridRacePair[];
    lookup: Record<number, Lookup>;
}

type SortMode = 'finish' | 'gainers';

function formatDelta(delta: number | null, statusLabel: string | null) {
    if (statusLabel) return statusLabel;
    if (delta == null) return '—';
    if (delta === 0) return '0';
    return delta > 0 ? `+${delta}` : `${delta}`;
}

function deltaClass(delta: number | null, statusLabel: string | null) {
    if (statusLabel === 'DSQ') return 'text-red-500';
    if (statusLabel === 'DNF') return 'text-zinc-400';
    if (statusLabel === 'DNS') return 'text-amber-500';
    if (delta == null || delta === 0) return 'text-zinc-400';
    if (delta > 0) return 'text-emerald-400';
    return 'text-red-400';
}

function DriverName({
    driverNumber,
    lookup,
}: {
    driverNumber: number;
    lookup: Record<number, Lookup>;
}) {
    const info = lookup[driverNumber] ?? {
        name: `Driver ${driverNumber}`,
        team: 'Unknown',
        teamColor: '#3f3f46',
    };

    return (
        <div className='flex items-center gap-2.5 min-w-0'>
            <span
                className='w-1 h-4 rounded-full shrink-0'
                style={{ backgroundColor: info.teamColor }}
            />
            <div className='min-w-0'>
                <p className='font-semibold text-zinc-200 truncate'>{info.name}</p>
                <p className='text-[10px] text-zinc-400 truncate'>{info.team}</p>
            </div>
        </div>
    );
}

function PositionTrack({ row, maxPos }: { row: GridRaceRow; maxPos: number }) {
    if (row.gridPosition == null || row.finishPosition == null) {
        return <div className='h-2 rounded-full bg-zinc-900' />;
    }

    const toPct = (pos: number) => ((pos - 1) / Math.max(maxPos - 1, 1)) * 100;
    const start = toPct(row.gridPosition);
    const end = toPct(row.finishPosition);
    const left = Math.min(start, end);
    const width = Math.abs(end - start);
    const gained = (row.delta ?? 0) > 0;
    const lost = (row.delta ?? 0) < 0;

    return (
        <div className='relative h-2 rounded-full bg-zinc-900'>
            <div
                className={`absolute top-0 h-2 rounded-full ${
                    gained ? 'bg-emerald-500/40' : lost ? 'bg-red-500/40' : 'bg-zinc-700'
                }`}
                style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
            />
            <span
                className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-400 border border-zinc-950'
                style={{ left: `${start}%` }}
            />
            <span
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                    gained ? 'bg-emerald-400' : lost ? 'bg-red-400' : 'bg-zinc-200'
                }`}
                style={{ left: `${end}%` }}
            />
        </div>
    );
}

function StatCard({
    label,
    row,
    lookup,
    empty,
}: {
    label: string;
    row: GridRaceRow | null;
    lookup: Record<number, Lookup>;
    empty: string;
}) {
    const info = row ? lookup[row.driverNumber] : null;
    const delta = row?.delta ?? null;

    return (
        <div className='border border-zinc-800 rounded-xl bg-linear-to-b from-zinc-900 to-zinc-950 p-4'>
            <p className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>{label}</p>
            {row && info ? (
                <div className='mt-2 flex items-end justify-between gap-3'>
                    <div className='min-w-0'>
                        <p className='text-sm font-bold text-zinc-100 truncate'>{info.name}</p>
                        <p className='text-[11px] text-zinc-400 font-mono mt-0.5'>
                            P{row.gridPosition ?? '—'} → P{row.finishPosition ?? '—'}
                        </p>
                    </div>
                    <span className={`font-mono text-2xl font-black tabular-nums ${deltaClass(delta, null)}`}>
                        {formatDelta(delta, null)}
                    </span>
                </div>
            ) : (
                <p className='mt-2 text-sm text-zinc-400'>{empty}</p>
            )}
        </div>
    );
}

export function GridVsRaceView({ pairs, lookup }: Props) {
    const defaultKind = pairs.find((p) => p.kind === 'race')?.kind ?? pairs[0]?.kind ?? 'race';
    const [kind, setKind] = useState<GridRacePair['kind']>(defaultKind);
    const [sortMode, setSortMode] = useState<SortMode>('finish');

    const pair = pairs.find((p) => p.kind === kind) ?? pairs[0];

    const rows = useMemo(() => {
        if (!pair) return [];
        const built = buildGridRaceRows(pair.gridSession.classification, pair.raceSession.classification);
        if (sortMode === 'gainers') {
            return [...built].sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999));
        }
        return built;
    }, [pair, sortMode]);

    const summary = useMemo(() => summarizeGridRace(rows), [rows]);
    const maxPos = Math.max(
        20,
        ...rows.map((r) => Math.max(r.gridPosition ?? 0, r.finishPosition ?? 0))
    );

    if (!pair) return null;

    return (
        <div className='space-y-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                {pairs.length > 1 ? (
                    <div className='flex gap-1 bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-1 w-fit'>
                        {pairs.map((p) => {
                            const active = p.kind === pair.kind;
                            return (
                                <button
                                    key={p.kind}
                                    onClick={() => setKind(p.kind)}
                                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors ${
                                        active
                                            ? 'bg-zinc-800 text-white border border-zinc-700/60'
                                            : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>
                        {pair.gridSession.sessionName} → {pair.raceSession.sessionName}
                    </p>
                )}

                <div className='flex gap-1 bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-1 w-fit'>
                    {(
                        [
                            { key: 'finish' as const, label: 'Finish order' },
                            { key: 'gainers' as const, label: 'Places gained' },
                        ] as const
                    ).map((option) => (
                        <button
                            key={option.key}
                            onClick={() => setSortMode(option.key)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors ${
                                sortMode === option.key
                                    ? 'bg-zinc-800 text-white border border-zinc-700/60'
                                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <StatCard
                    label='Biggest gainer'
                    row={summary.biggestGainer && (summary.biggestGainer.delta ?? 0) > 0 ? summary.biggestGainer : null}
                    lookup={lookup}
                    empty='No places gained'
                />
                <StatCard
                    label='Biggest drop'
                    row={summary.biggestDrop && (summary.biggestDrop.delta ?? 0) < 0 ? summary.biggestDrop : null}
                    lookup={lookup}
                    empty='No places lost'
                />
                <div className='border border-zinc-800 rounded-xl bg-linear-to-b from-zinc-900 to-zinc-950 p-4'>
                    <p className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>
                        Field movement
                    </p>
                    <div className='mt-2 flex items-end justify-between gap-3'>
                        <p className='text-sm text-zinc-400'>
                            {summary.placesChanged} drivers changed position
                        </p>
                        <span className='font-mono text-2xl font-black text-zinc-100 tabular-nums'>
                            {summary.netPlacesSwung}
                        </span>
                    </div>
                    <p className='text-[11px] text-zinc-400 mt-1'>places swapped</p>
                </div>
            </div>

            <div className={TABLE_CONTAINER_CLASS}>
                <div className='p-4 pl-5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                        <ArrowRight className='w-4 h-4 text-zinc-400' />
                        <h3 className='text-xs font-bold text-zinc-400 uppercase tracking-widest'>
                            Grid → Finish
                        </h3>
                    </div>
                    <span className='text-[10px] text-zinc-400 font-medium uppercase tracking-wider'>
                        {pair.gridSession.sessionName} vs {pair.raceSession.sessionName}
                    </span>
                </div>

                <table className='w-full text-left border-collapse min-w-160'>
                    <thead>
                        <tr className={TABLE_THEAD_CLASS}>
                            <th className='p-4 pl-5 w-16'>Finish</th>
                            <th className='p-4'>Driver</th>
                            <th className='p-4 text-center w-16'>Grid</th>
                            <th className='p-4 min-w-40'>
                                <span className='flex items-center justify-between text-[10px]'>
                                    <span>P1</span>
                                    <span>Last</span>
                                </span>
                            </th>
                            <th className='p-4 text-right w-24'>Delta</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-zinc-900'>
                        {rows.map((row) => {
                            const info = lookup[row.driverNumber];
                            const DeltaIcon =
                                row.statusLabel || row.delta == null || row.delta === 0
                                    ? Minus
                                    : row.delta > 0
                                      ? ArrowUpRight
                                      : ArrowDownRight;

                            return (
                                <tr
                                    key={row.driverNumber}
                                    className='hover:bg-zinc-900/50 transition-colors'
                                >
                                    <td
                                        className={`p-4 pl-5 font-black font-mono tracking-tight ${getPositionColor(row.finishPosition || 0)}`}
                                        style={{ borderLeft: `4px solid ${info?.teamColor ?? '#3f3f46'}` }}
                                    >
                                        {row.statusLabel ?? row.finishPosition ?? '—'}
                                    </td>
                                    <td className='p-4'>
                                        <DriverName driverNumber={row.driverNumber} lookup={lookup} />
                                    </td>
                                    <td className='p-4 text-center font-mono text-zinc-400 tabular-nums'>
                                        {row.gridPosition ?? '—'}
                                    </td>
                                    <td className='p-4'>
                                        <PositionTrack row={row} maxPos={maxPos} />
                                    </td>
                                    <td className='p-4 text-right'>
                                        <span
                                            className={`inline-flex items-center justify-end gap-1 font-mono font-bold tabular-nums ${deltaClass(row.delta, row.statusLabel)}`}
                                        >
                                            <DeltaIcon className='w-3.5 h-3.5' />
                                            {formatDelta(row.delta, row.statusLabel)}
                                        </span>
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

interface EmptyPairProps {
    results: RaceResult[];
}

export function GridVsRaceUnavailable({ results }: EmptyPairProps) {
    const hasRace = results.some((r) => r.sessionName.toLowerCase() === 'race');
    const hasQuali = results.some((r) => r.sessionName.toLowerCase().includes('qualifying'));

    return (
        <div className='border border-zinc-800 rounded-xl bg-zinc-950 px-5 py-10 text-center'>
            <p className='text-zinc-200 font-bold'>Grid vs finish is not ready yet</p>
            <p className='text-zinc-400 text-xs mt-2 leading-relaxed max-w-md mx-auto'>
                {!hasQuali && !hasRace
                    ? 'This weekend still needs qualifying and race classifications.'
                    : !hasQuali
                      ? 'Qualifying results have not been loaded for this meeting.'
                      : 'Race classification has not been loaded for this meeting.'}
            </p>
        </div>
    );
}
