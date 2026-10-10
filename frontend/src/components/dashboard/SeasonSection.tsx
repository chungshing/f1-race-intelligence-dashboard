'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { RoundResult } from '@/lib/driverProfile';
import { formatHexColor } from '@/utils/sessions';
import { getPositionColor, TABLE_CONTAINER_CLASS, TABLE_THEAD_CLASS } from '@/utils/styles';

const Y_AXIS_WIDTH = 36;
const CELL_MIN_WIDTH = 34;

type Status = 'DSQ' | 'DNF' | 'DNS' | null;

function statusOf(r: RoundResult): Status {
    if (r.dsq) return 'DSQ';
    if (r.dnf) return 'DNF';
    if (r.dns) return 'DNS';
    return null;
}

function positionLabel(position: number | null, status: Status): string {
    if (status) return status;
    if (position === null) return '—';
    return `P${position}`;
}

function cellTone(r: RoundResult): string {
    if (statusOf(r)) return 'bg-red-500/10 text-red-400';
    if (r.position === 1) return 'bg-amber-400/15 text-amber-400';
    if (r.position === 2) return 'bg-zinc-900 text-zinc-300';
    if (r.position === 3) return 'bg-amber-600/15 text-amber-600';
    if (r.position !== null && r.position <= 10) return 'bg-zinc-900 text-zinc-100';
    return 'bg-zinc-900 text-zinc-400';
}

interface SeasonSectionProps {
    results: RoundResult[];
    teamColor: string;
}

export function SeasonSection({ results, teamColor }: SeasonSectionProps) {
    const [activeIndex, setActiveIndex] = useState(results.length - 1);
    const [showDetails, setShowDetails] = useState(false);
    const color = formatHexColor(teamColor);

    const roundByNumber = useMemo(
        () => new Map(results.map((r) => [r.round, r] as const)),
        [results],
    );

    const duplicateCountries = useMemo(() => {
        const counts = new Map<string, number>();
        results.forEach((r) => counts.set(r.country, (counts.get(r.country) ?? 0) + 1));
        return new Set(
            Array.from(counts.entries())
                .filter(([, n]) => n > 1)
                .map(([country]) => country),
        );
    }, [results]);

    if (results.length === 0) {
        return (
            <div className='rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400'>
                No race results yet this season.
            </div>
        );
    }

    const raceName = (r: RoundResult) =>
        duplicateCountries.has(r.country) && r.circuit ? `${r.country} (${r.circuit})` : r.country;

    const active = results[Math.min(Math.max(activeIndex, 0), results.length - 1)];
    const activeStatus = statusOf(active);
    const hasSprint = results.some((r) => r.sprintPosition !== null);

    return (
        <div className='rounded-xl border border-zinc-800 bg-zinc-900/40 p-4'>
            <div className='mb-2 flex items-baseline justify-between'>
                <h3 className='text-[11px] font-bold uppercase tracking-widest text-zinc-400'>Season</h3>
                {hasSprint && (
                    <span className='flex items-center gap-1.5 text-[10px] text-zinc-400'>
                        <span className='h-1.25w-[5px] rounded-full bg-yellow-500' />
                        Sprint weekend
                    </span>
                )}
            </div>

            <div className='overflow-x-auto'>
                <div style={{ minWidth: results.length * CELL_MIN_WIDTH + Y_AXIS_WIDTH + 8 }}>
                    <ResponsiveContainer width='100%' height={170}>
                        <LineChart data={results} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke='#27272a' strokeDasharray='3 3' vertical={false} />
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
                                formatter={(value) => [String(value), 'Total points']}
                            />
                            <Line
                                type='monotone'
                                dataKey='cumulativePoints'
                                stroke={color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <div
                        className='mt-1.5 grid gap-1'
                        style={{
                            gridTemplateColumns: `repeat(${results.length}, minmax(0, 1fr))`,
                            marginLeft: Y_AXIS_WIDTH,
                            marginRight: 8,
                        }}
                    >
                        {results.map((r, i) => {
                            const status = statusOf(r);
                            const isActive = i === activeIndex;
                            return (
                                <button
                                    key={r.meetingKey}
                                    type='button'
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onFocus={() => setActiveIndex(i)}
                                    onClick={() => setActiveIndex(i)}
                                    aria-label={`Round ${r.round} ${raceName(r)}: ${positionLabel(r.position, status)}`}
                                    className={`relative flex flex-col items-center gap-0.5 rounded-md py-1.5 transition-colors ${cellTone(r)} ${
                                        isActive ? 'ring-1 ring-zinc-400' : ''
                                    }`}
                                >
                                    <span className='text-[9px] text-zinc-400'>R{r.round}</span>
                                    <span className='text-xs font-bold'>
                                        {positionLabel(r.position, status)}
                                    </span>
                                    {r.sprintPosition !== null && (
                                        <span className='absolute right-1 top-1 h-1.25 w-1.25 rounded-full bg-yellow-500' />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <p className='mt-3 min-h-5 text-xs text-zinc-400'>
                <span className='font-bold text-zinc-100'>
                    R{active.round} · {raceName(active)}
                </span>
                {' — '}Race {positionLabel(active.position, activeStatus)}
                {active.sprintPosition !== null && ` · Sprint P${active.sprintPosition}`}
                {` · ${active.roundPoints} pts · ${active.cumulativePoints} total`}
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
                                    <th className='w-20 p-3 text-center'>Pos</th>
                                    {hasSprint && <th className='w-20 p-3 text-center'>Sprint</th>}
                                    <th className='w-24 p-3 text-right'>Points</th>
                                    <th className='w-28 p-3 text-right'>Cumulative</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-zinc-800/50'>
                                {results.map((r) => {
                                    const status = statusOf(r);
                                    return (
                                        <tr key={r.meetingKey} className='transition-colors hover:bg-zinc-800/20'>
                                            <td className='p-3 text-center font-mono text-zinc-400'>{r.round}</td>
                                            <td className='p-3 text-zinc-200'>
                                                <Link
                                                    href={`/races/${r.meetingKey}`}
                                                    className='transition-colors hover:text-red-400'
                                                >
                                                    {raceName(r)}
                                                </Link>
                                            </td>
                                            <td
                                                className={`p-3 text-center font-bold ${
                                                    status ? 'text-red-400' : getPositionColor(r.position ?? 99)
                                                }`}
                                            >
                                                {positionLabel(r.position, status)}
                                            </td>
                                            {hasSprint && (
                                                <td className='p-3 text-center font-mono text-zinc-400'>
                                                    {r.sprintPosition !== null ? `P${r.sprintPosition}` : '—'}
                                                </td>
                                            )}
                                            <td className='p-3 text-right font-mono text-zinc-300'>
                                                {r.roundPoints}
                                            </td>
                                            <td className='p-3 text-right font-mono font-bold text-zinc-100'>
                                                {r.cumulativePoints}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}