'use client';

import { Card, CardBody, CardHeader, CardMeta } from '@/components/ui/Card';
import { useCircuitWinners } from '@/hooks/useCircuitWinners';
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

function Chip({ label, value }: { label: string; value: string }) {
    return (
        <div className='rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2'>
            <p className='text-[9px] font-bold uppercase tracking-wider text-zinc-500'>{label}</p>
            <p className='mt-0.5 font-mono text-sm font-bold text-zinc-100'>{value}</p>
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
            <div className='h-48 animate-pulse rounded-xl border border-zinc-800/50 bg-zinc-900/40' />
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

    const known = data.winners.filter((w) => typeof w.grid === 'number');
    const fromPole = known.filter((w) => w.grid === 1).length;
    const racedFromGrid = known.filter((w) => w.grid > 0);
    const averageStart = racedFromGrid.length
        ? racedFromGrid.reduce((sum, w) => sum + w.grid, 0) / racedFromGrid.length
        : null;
    const furthestBack = racedFromGrid.length
        ? racedFromGrid.reduce((worst, w) => (w.grid > worst.grid ? w : worst))
        : null;

    return (
        <Card>
            <CardHeader
                icon={History}
                title='Past Winners'
                subtitle={weekend?.circuit}
                right={
                    data.mostWins ? (
                        <CardMeta>
                            Most wins: {data.mostWins.driver.split(' ').pop()} ({data.mostWins.wins}
                            )
                        </CardMeta>
                    ) : undefined
                }
            />
            <CardBody className='space-y-4'>
                {known.length > 0 && (
                    <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                        <Chip label='Won from pole' value={`${fromPole} of ${known.length}`} />
                        <Chip
                            label='Average winning start'
                            value={averageStart ? `P${averageStart.toFixed(1)}` : '—'}
                        />
                        <Chip
                            label='Furthest-back win'
                            value={
                                furthestBack
                                    ? `P${furthestBack.grid} · ${furthestBack.season}`
                                    : '—'
                            }
                        />
                    </div>
                )}

                <div className='overflow-hidden rounded-lg border border-zinc-800/80'>
                    {data.winners.map((winner) => {
                        const color = teamColor(winner.team);
                        const badge = gridBadge(winner.grid);
                        const isTopWinner = data.mostWins?.driver === winner.driver;

                        return (
                            <div
                                key={winner.season}
                                className='group flex items-center gap-3 border-b border-zinc-900 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-zinc-900/50'
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

                <p className='text-[10px] text-zinc-500'>
                    Badge = starting position of the winner. Green is pole, amber is a win from
                    outside the top 10.
                </p>
            </CardBody>
        </Card>
    );
}
