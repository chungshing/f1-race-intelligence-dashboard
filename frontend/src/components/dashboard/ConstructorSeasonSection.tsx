'use client';

import { ConstructorRoundResult } from '@/lib/constructorProfile';
import { DriverStanding } from '@/types/standing';
import {
    cellTone,
    createRaceNamer,
    driverCode,
    driverColorMap,
    positionLabel,
    statusOf,
} from '@/utils/seasonCells';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const Y_AXIS_WIDTH = 36;
const CELL_MIN_WIDTH = 34;

interface ConstructorSeasonSectionProps {
    results: ConstructorRoundResult[];
    drivers: DriverStanding[];
}

export function ConstructorSeasonSection({ results, drivers }: ConstructorSeasonSectionProps) {
    const [activeIndex, setActiveIndex] = useState(results.length - 1);
    const [showDetails, setShowDetails] = useState(false);

    const colors = useMemo(() => driverColorMap(drivers), [drivers]);
    const raceName = useMemo(() => createRaceNamer(results), [results]);
    const roundByNumber = useMemo(
        () => new Map(results.map((r) => [r.round, r] as const)),
        [results]
    );

    // One cumulative-points series per driver; a driver who skipped a round keeps their last total.
    const chartData = useMemo(() => {
        const running = new Map<number, number>();
        return results.map((r) => {
            r.driverBreakdown.forEach((d) => running.set(d.driverNumber, d.cumulativePoints));
            const row: Record<string, number> = { round: r.round };
            drivers.forEach((d) => {
                row[`d${d.driverNumber}`] = running.get(d.driverNumber) ?? 0;
            });
            return row;
        });
    }, [results, drivers]);

    if (results.length === 0) {
        return (
            <div className='rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400'>
                No race results yet this season.
            </div>
        );
    }

    const active = results[Math.min(Math.max(activeIndex, 0), results.length - 1)];
    const hasSprint = results.some((r) => r.driverBreakdown.some((d) => d.sprintPosition !== null));
    const gridStyle = {
        gridTemplateColumns: `repeat(${results.length}, minmax(0, 1fr))`,
        marginLeft: Y_AXIS_WIDTH,
        marginRight: 8,
    };

    return (
        <div className='rounded-xl border border-zinc-800 bg-zinc-900/40 p-4'>
            <div className='mb-2 flex items-baseline justify-between'>
                <h3 className='text-[11px] font-bold uppercase tracking-widest text-zinc-400'>
                    Season
                </h3>
                {hasSprint && (
                    <span className='flex items-center gap-1.5 text-[10px] text-zinc-400'>
                        <span className='h-1.25 w-1.25 rounded-full bg-yellow-500' />
                        Sprint weekend
                    </span>
                )}
            </div>

            <div className='overflow-x-auto'>
                <div style={{ minWidth: results.length * CELL_MIN_WIDTH + Y_AXIS_WIDTH + 8 }}>
                    <ResponsiveContainer width='100%' height={170}>
                        <LineChart
                            data={chartData}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                stroke='#27272a'
                                strokeDasharray='3 3'
                                vertical={false}
                            />
                            <XAxis dataKey='round' scale='band' hide />
                            <YAxis
                                width={Y_AXIS_WIDTH}
                                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ stroke: '#3f3f46' }}
                                contentStyle={{
                                    backgroundColor: '#09090b',
                                    border: '1px solid #27272a',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }}
                                labelFormatter={(label) => {
                                    const r = roundByNumber.get(Number(label));
                                    return r ? `R${r.round} · ${raceName(r)}` : '';
                                }}
                            />
                            {drivers.map((d) => (
                                <Line
                                    key={d.driverNumber}
                                    type='monotone'
                                    dataKey={`d${d.driverNumber}`}
                                    name={d.driverName}
                                    stroke={colors.get(d.driverNumber)}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>

                    <div className='mt-1.5'>
                        <div className='mb-1 grid gap-1' style={gridStyle}>
                            {results.map((r) => (
                                <span
                                    key={r.meetingKey}
                                    className='text-center text-[9px] text-zinc-400'
                                >
                                    R{r.round}
                                </span>
                            ))}
                        </div>

                        {drivers.map((d) => (
                            <div key={d.driverNumber} className='relative mb-1'>
                                <span
                                    className='absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold'
                                    style={{ color: colors.get(d.driverNumber) }}
                                >
                                    {driverCode(d.driverName)}
                                </span>
                                <div className='grid gap-1' style={gridStyle}>
                                    {results.map((r, i) => {
                                        const entry = r.driverBreakdown.find(
                                            (x) => x.driverNumber === d.driverNumber
                                        );
                                        if (!entry) {
                                            return (
                                                <div
                                                    key={r.meetingKey}
                                                    className='rounded-md bg-zinc-900/50 py-1.75 text-center text-xs text-zinc-500'
                                                >
                                                    —
                                                </div>
                                            );
                                        }
                                        const status = statusOf(entry);
                                        return (
                                            <button
                                                key={r.meetingKey}
                                                type='button'
                                                onMouseEnter={() => setActiveIndex(i)}
                                                onFocus={() => setActiveIndex(i)}
                                                onClick={() => setActiveIndex(i)}
                                                aria-label={`${driverCode(d.driverName)} round ${r.round} ${raceName(r)}: ${positionLabel(entry.position, status)}`}
                                                className={`relative rounded-md py-1.75 text-xs font-bold transition-colors ${cellTone(entry.position, status)} ${
                                                    i === activeIndex ? 'ring-1 ring-zinc-400' : ''
                                                }`}
                                            >
                                                {positionLabel(entry.position, status)}
                                                {entry.sprintPosition !== null && (
                                                    <span className='absolute right-1 top-1 h-1.25 w-1.25 rounded-full bg-yellow-500' />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <p className='mt-3 min-h-5 text-xs text-zinc-400'>
                <span className='font-bold text-zinc-100'>
                    R{active.round} · {raceName(active)}
                </span>
                {active.driverBreakdown.map((d, i) => (
                    <span key={d.driverNumber}>
                        {i === 0 ? ' — ' : ' · '}
                        <span className='font-bold' style={{ color: colors.get(d.driverNumber) }}>
                            {driverCode(d.driverName)}
                        </span>
                        {` ${positionLabel(d.position, statusOf(d))}${
                            d.sprintPosition !== null ? ` (Sprint P${d.sprintPosition})` : ''
                        } · ${d.points} pts`}
                    </span>
                ))}
                <span className='text-zinc-100'>{` · team ${active.cumulativePoints}`}</span>
            </p>

            <div className='mt-3 border-t border-zinc-900 pt-3'>
                <button
                    type='button'
                    onClick={() => setShowDetails((prev) => !prev)}
                    className='flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-200'
                >
                    {showDetails ? 'Hide round details' : 'Show round details'}
                    <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    />
                </button>

                {showDetails && (
                    <div className={`${TABLE_CONTAINER_CLASS} mt-3`}>
                        <table className='w-full border-collapse text-left text-sm'>
                            <thead>
                                <tr className={TABLE_THEAD_CLASS}>
                                    <th className='w-16 p-3 text-center'>Rd</th>
                                    <th className='p-3'>Race</th>
                                    {drivers.map((d) => (
                                        <th
                                            key={d.driverNumber}
                                            className='w-24 p-3 text-center'
                                            style={{ color: colors.get(d.driverNumber) }}
                                        >
                                            {driverCode(d.driverName)}
                                        </th>
                                    ))}
                                    <th className='w-24 p-3 text-right'>Points</th>
                                    <th className='w-28 p-3 text-right'>Cumulative</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-zinc-800/50'>
                                {results.map((r) => (
                                    <tr
                                        key={r.meetingKey}
                                        className='transition-colors hover:bg-zinc-800/20'
                                    >
                                        <td className='p-3 text-center font-mono text-zinc-400'>
                                            {r.round}
                                        </td>
                                        <td className='p-3 text-zinc-200'>
                                            <Link
                                                href={`/races/${r.meetingKey}`}
                                                className='transition-colors hover:text-red-400'
                                            >
                                                {raceName(r)}
                                            </Link>
                                        </td>
                                        {drivers.map((d) => {
                                            const entry = r.driverBreakdown.find(
                                                (x) => x.driverNumber === d.driverNumber
                                            );
                                            if (!entry) {
                                                return (
                                                    <td
                                                        key={d.driverNumber}
                                                        className='p-3 text-center text-zinc-500'
                                                    >
                                                        —
                                                    </td>
                                                );
                                            }
                                            const status = statusOf(entry);
                                            return (
                                                <td
                                                    key={d.driverNumber}
                                                    className='p-3 text-center'
                                                >
                                                    <span
                                                        className={`font-bold ${
                                                            status
                                                                ? 'text-red-400'
                                                                : getPositionColor(
                                                                      entry.position ?? 99
                                                                  )
                                                        }`}
                                                    >
                                                        {positionLabel(entry.position, status)}
                                                    </span>
                                                    {entry.sprintPosition !== null && (
                                                        <span className='block text-[10px] text-zinc-400'>
                                                            Sprint P{entry.sprintPosition}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className='p-3 text-right font-mono text-zinc-300'>
                                            {r.teamPoints}
                                        </td>
                                        <td className='p-3 text-right font-mono font-bold text-zinc-100'>
                                            {r.cumulativePoints}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
