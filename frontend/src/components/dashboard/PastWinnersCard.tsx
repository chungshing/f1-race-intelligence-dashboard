'use client';

import { Card, CardBody, CardHeader, CardMeta } from '@/components/ui/Card';
import { CircuitHistory, useCircuitWinners, WinTally } from '@/hooks/useCircuitWinners';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { Crown, History } from 'lucide-react';

// Jolpica team names across eras, mapped to their livery colour. Order matters: specific first.
const TEAM_COLORS: [string, string][] = [
    ['racing bulls', '#6692FF'],
    ['toro rosso', '#6692FF'],
    ['alphatauri', '#6692FF'],
    ['rb f1', '#6692FF'],
    ['red bull', '#3671C6'],
    ['ferrari', '#E8002D'],
    ['mercedes', '#27F4D2'],
    ['mclaren', '#FF8000'],
    ['williams', '#64C4FF'],
    ['alpine', '#FF87BC'],
    ['renault', '#FFD800'],
    ['aston martin', '#229971'],
    ['haas', '#B6BABD'],
    ['sauber', '#52E252'],
    ['alfa romeo', '#C92D4B'],
    ['kick', '#52E252'],
    ['racing point', '#F596C8'],
    ['force india', '#F596C8'],
    ['lotus', '#C9A227'],
    ['benetton', '#00A0DE'],
    ['brawn', '#B7E31A'],
    ['jordan', '#F5D100'],
    ['brabham', '#2E7D32'],
];

const teamColor = (team: string) => {
    const name = team.toLowerCase();
    return TEAM_COLORS.find(([key]) => name.includes(key))?.[1] ?? '#71717a';
};

const DRIVER_BAR = '#a1a1aa';

function gridBadge(grid: number | undefined) {
    if (typeof grid !== 'number') {
        return { label: '—', className: 'text-zinc-600 border-transparent' };
    }
    if (grid === 0) {
        return { label: 'Pit', className: 'text-red-400 border-red-500/30 bg-red-500/10' };
    }
    if (grid === 1) {
        return {
            label: 'P1',
            className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        };
    }
    if (grid <= 3) {
        return { label: `P${grid}`, className: 'text-zinc-200 border-zinc-700 bg-zinc-800/60' };
    }
    if (grid <= 10) {
        return { label: `P${grid}`, className: 'text-zinc-400 border-zinc-800 bg-zinc-900/60' };
    }
    return { label: `P${grid}`, className: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className='mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
            {children}
        </h3>
    );
}

function Leaderboard({
    title,
    rows,
    colorFor,
    shortName,
}: {
    title: string;
    rows: WinTally[];
    colorFor: (name: string) => string;
    shortName?: boolean;
}) {
    const max = rows[0]?.wins ?? 1;

    return (
        <div>
            <SectionTitle>{title}</SectionTitle>
            <div className='space-y-2'>
                {rows.map((row, i) => (
                    <div key={row.name}>
                        <div className='mb-1 flex items-center justify-between gap-2 text-xs'>
                            <span className='flex min-w-0 items-center gap-1.5 truncate font-medium text-zinc-200'>
                                {i === 0 && (
                                    <Crown
                                        className='h-3 w-3 shrink-0 text-amber-400'
                                        aria-label='Most wins'
                                    />
                                )}
                                <span className='truncate'>
                                    {shortName ? row.name.split(' ').pop() : row.name}
                                </span>
                            </span>
                            <span className='shrink-0 font-mono font-bold text-zinc-100'>
                                {row.wins}
                            </span>
                        </div>
                        <div className='h-1.5 overflow-hidden rounded-full bg-zinc-800'>
                            <div
                                className='h-full rounded-full'
                                style={{
                                    width: `${(row.wins / max) * 100}%`,
                                    backgroundColor: colorFor(row.name),
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StartPositions({ starts }: { starts: CircuitHistory['starts'] }) {
    if (starts.known === 0) return null;

    const segments = [
        { key: 'pole', label: 'Pole', count: starts.pole, color: '#10b981' },
        { key: 'front', label: 'P2–3', count: starts.front, color: '#d4d4d8' },
        { key: 'midfield', label: 'P4–10', count: starts.midfield, color: '#71717a' },
        { key: 'back', label: 'P11+', count: starts.back, color: '#f59e0b' },
        { key: 'pit', label: 'Pit lane', count: starts.pit, color: '#ef4444' },
    ].filter((s) => s.count > 0);

    return (
        <div>
            <div className='mb-2.5 flex items-baseline justify-between gap-2'>
                <SectionTitle>Where winners started</SectionTitle>
                {starts.average !== null && (
                    <span className='font-mono text-[10px] text-zinc-500'>
                        avg P{starts.average.toFixed(1)}
                    </span>
                )}
            </div>

            <div className='flex h-6 gap-0.5 overflow-hidden rounded-md'>
                {segments.map((s) => (
                    <div
                        key={s.key}
                        className='flex items-center justify-center text-[10px] font-bold text-zinc-950'
                        style={{
                            width: `${(s.count / starts.known) * 100}%`,
                            backgroundColor: s.color,
                        }}
                        title={`${s.label}: ${s.count} of ${starts.known}`}
                    >
                        {s.count / starts.known >= 0.1 ? s.count : ''}
                    </div>
                ))}
            </div>

            <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1'>
                {segments.map((s) => (
                    <span
                        key={s.key}
                        className='flex items-center gap-1.5 text-[11px] text-zinc-400'
                    >
                        <span className='h-2 w-2 rounded-sm' style={{ backgroundColor: s.color }} />
                        {s.label}
                        <span className='font-mono text-zinc-500'>{s.count}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

export function PastWinnersCard({ meetingKey }: { meetingKey: number }) {
    const { data: weekends } = useRaceWeekends();
    const weekend = weekends.find((w) => w.meetingKey === meetingKey);
    const raceDate =
        weekend?.sessions.find((s) => s.sessionName === 'Race')?.dateStart.slice(0, 10) ?? null;

    const { data, isPending, isError } = useCircuitWinners(raceDate);

    if (!raceDate) return null;
    if (isPending) {
        return (
            <div className='h-64 animate-pulse rounded-xl border border-zinc-800/50 bg-zinc-900/40' />
        );
    }
    if (isError || !data || data.winners.length === 0) {
        return (
            <p className='rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400'>
                {isError
                    ? 'Circuit history is unavailable right now.'
                    : 'No previous races at this circuit.'}
            </p>
        );
    }

    return (
        <Card>
            <CardHeader
                icon={History}
                title='Circuit History'
                subtitle={weekend?.circuit}
                right={<CardMeta>{data.totalRaces} past races</CardMeta>}
            />
            <CardBody className='space-y-6'>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                    <Leaderboard
                        title='Wins by driver'
                        rows={data.topDrivers}
                        colorFor={() => DRIVER_BAR}
                    />
                    <Leaderboard title='Wins by team' rows={data.topTeams} colorFor={teamColor} />
                </div>

                <StartPositions starts={data.starts} />

                <div>
                    <SectionTitle>Recent winners</SectionTitle>
                    <div className='overflow-hidden rounded-lg border border-zinc-800/80'>
                        {data.winners.map((winner) => {
                            const color = teamColor(winner.team);
                            const badge = gridBadge(winner.grid);
                            const isTopWinner = data.mostWins?.driver === winner.driver;

                            return (
                                <div
                                    key={winner.season}
                                    className='flex items-center gap-3 border-b border-zinc-900 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-zinc-900/50'
                                    style={{ boxShadow: `inset 3px 0 0 ${color}` }}
                                >
                                    <span className='w-11 shrink-0 pl-1 font-mono text-xs text-zinc-500'>
                                        {winner.season}
                                    </span>

                                    <div className='min-w-0 flex-1'>
                                        <p className='flex items-center gap-1.5 truncate text-sm font-bold text-zinc-100'>
                                            {winner.driver}
                                            {isTopWinner && (
                                                <Crown
                                                    className='h-3 w-3 shrink-0 text-amber-400'
                                                    aria-label='Most wins at this circuit'
                                                />
                                            )}
                                        </p>
                                        <p className='flex items-center gap-1.5 truncate text-[11px] text-zinc-400'>
                                            <span
                                                className='h-1.5 w-1.5 shrink-0 rounded-full'
                                                style={{ backgroundColor: color }}
                                            />
                                            {winner.team}
                                        </p>
                                    </div>

                                    <span
                                        className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${badge.className}`}
                                        title='Starting position'
                                    >
                                        {badge.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
