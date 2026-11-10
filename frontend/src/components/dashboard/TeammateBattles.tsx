'use client';

import { Card, CardBody, CardHeader, CardNote } from '@/components/ui/Card';
import { buildTeammateBattles, TeammatePair } from '@/lib/teammates';
import { SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { Users } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    rows: SupabaseRaceResultRow[];
    drivers: DriverStanding[];
}

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

function SplitBar({ left, right, color }: { left: number; right: number; color: string }) {
    const total = left + right;
    const leftPct = total === 0 ? 50 : (left / total) * 100;

    return (
        <div className='flex h-1.5 rounded-full overflow-hidden bg-zinc-900'>
            <div style={{ width: `${leftPct}%`, backgroundColor: color }} />
            <div className='flex-1 bg-zinc-600' />
        </div>
    );
}

function Row({
    label,
    left,
    right,
    color,
}: {
    label: string;
    left: number;
    right: number;
    color: string;
}) {
    return (
        <div className='space-y-1'>
            <div className='flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400'>
                <span className='font-mono text-xs text-zinc-100 tabular-nums'>{left}</span>
                <span>{label}</span>
                <span className='font-mono text-xs text-zinc-100 tabular-nums'>{right}</span>
            </div>
            <SplitBar left={left} right={right} color={color} />
        </div>
    );
}

function gapText(pair: TeammatePair) {
    if (pair.medianGapPct == null) return null;

    const faster = pair.medianGapPct >= 0 ? pair.a : pair.b;
    const surname = faster.name.split(' ').slice(-1)[0];
    return `${surname} ${Math.abs(pair.medianGapPct).toFixed(2)}% quicker in qualifying`;
}

export function TeammateBattles({ rows, drivers }: Props) {
    const pairs = useMemo(() => buildTeammateBattles(rows, drivers), [rows, drivers]);

    if (pairs.length === 0) return null;

    return (
        <Card>
            <CardHeader icon={Users} title='Teammate Battles' subtitle='Head-to-head, season to date' />

            <CardBody className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
                {pairs.map((pair) => {
                    const color = toHex(pair.teamColor);
                    const gap = gapText(pair);

                    return (
                        <div
                            key={pair.key}
                            className='rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-3 min-w-0'
                            style={{ borderLeft: `3px solid ${color}` }}
                        >
                            <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate'>
                                {pair.teamName}
                            </p>

                            <div className='flex items-center justify-between gap-3 text-sm font-bold text-zinc-100'>
                                <span className='truncate'>{pair.a.name}</span>
                                <span className='truncate text-right'>{pair.b.name}</span>
                            </div>

                            <Row
                                label='Qualifying'
                                left={pair.qualiA}
                                right={pair.qualiB}
                                color={color}
                            />
                            <Row label='Race' left={pair.raceA} right={pair.raceB} color={color} />
                            <Row
                                label='Points'
                                left={pair.a.points}
                                right={pair.b.points}
                                color={color}
                            />

                            {gap && <p className='text-[10px] text-zinc-400'>{gap}</p>}
                        </div>
                    );
                })}
            </CardBody>

            <CardNote>
                Race counts a finisher ahead of a retirement, and skips races where both retired or
                neither started. The qualifying gap is the median over the season, using each
                driver&apos;s best lap, so a driver knocked out earlier looks slower than they were.
                Teams are matched by each driver&apos;s current team.
            </CardNote>
        </Card>
    );
}
