'use client';

import { TitleSimulator } from '@/components/dashboard/TitleSimulator';
import { RaceWeekend } from '@/types/race';
import { DriverStanding, Team } from '@/types/standing';
import {
    TitleEntry,
    TitleKind,
    computeTitleFight,
    countRemainingRounds,
    listRemainingRounds,
} from '@/utils/titleFight';
import { Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    drivers: DriverStanding[];
    teams: Team[];
    races: RaceWeekend[];
}

const MAX_ROWS = 6;
const SIMULATED_DRIVERS = 5;

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

export function TitleFightCard({ drivers, teams, races }: Props) {
    const [kind, setKind] = useState<TitleKind>('drivers');
    const [simulating, setSimulating] = useState(false);

    const remaining = useMemo(() => countRemainingRounds(races), [races]);
    const rounds = useMemo(() => listRemainingRounds(races), [races]);

    const entries = useMemo<TitleEntry[]>(
        () =>
            kind === 'drivers'
                ? drivers.map((d) => ({
                      key: String(d.driverNumber),
                      name: d.driverName,
                      color: toHex(d.teamColor),
                      points: d.points,
                  }))
                : teams.map((t) => ({
                      key: t.teamName,
                      name: t.teamName,
                      color: toHex(t.teamColor),
                      points: t.points,
                  })),
        [kind, drivers, teams]
    );

    const fight = useMemo(
        () => computeTitleFight(entries, kind, remaining),
        [entries, kind, remaining]
    );

    if (!fight) return null;

    const shown = fight.contenders.slice(0, MAX_ROWS);
    const hiddenAlive = fight.contenders.length - shown.length;
    const canSimulate = kind === 'drivers' && !fight.champion && rounds.length > 0;

    return (
        <div className='bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                    <Trophy className='w-4 h-4 text-zinc-400' />
                    <h3 className='text-sm font-bold text-zinc-300'>Title Fight</h3>
                    <span className='text-[10px] font-medium text-zinc-400'>
                        {remaining.races} {remaining.races === 1 ? 'race' : 'races'}
                        {remaining.sprints > 0 &&
                            ` + ${remaining.sprints} ${remaining.sprints === 1 ? 'sprint' : 'sprints'}`}{' '}
                        left · {fight.maxAvailable} pts available
                    </span>
                </div>

                <div className='flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-full sm:max-w-60'>
                    {(['drivers', 'constructors'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setKind(tab)}
                            className={`flex-1 py-1 text-[11px] font-bold uppercase rounded-md transition-all ${
                                kind === tab
                                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                                    : 'text-zinc-400 hover:text-zinc-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {fight.champion ? (
                <div className='flex items-center justify-between gap-3 border border-zinc-800 rounded-lg bg-zinc-950/60 px-4 py-3'>
                    <div className='flex items-center gap-2.5 min-w-0'>
                        <span
                            className='w-1 h-5 rounded-full shrink-0'
                            style={{ backgroundColor: fight.champion.color }}
                        />
                        <p className='text-sm font-bold text-zinc-100 truncate'>
                            {fight.champion.name}
                        </p>
                    </div>
                    <span className='text-[10px] font-bold text-emerald-400 uppercase tracking-widest'>
                        {remaining.races + remaining.sprints === 0 ? 'Champion' : 'Title clinched'}
                    </span>
                </div>
            ) : (
                <div className='space-y-2.5'>
                    {shown.map((entry, index) => {
                        const pct =
                            fight.maxAvailable > 0
                                ? Math.min(100, (entry.gap / fight.maxAvailable) * 100)
                                : 0;

                        return (
                            <div key={entry.key} className='space-y-1'>
                                <div className='flex items-center justify-between gap-3'>
                                    <div className='flex items-center gap-2.5 min-w-0'>
                                        <span
                                            className='w-1 h-4 rounded-full shrink-0'
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <p className='text-xs font-semibold text-zinc-200 truncate'>
                                            {entry.name}
                                        </p>
                                    </div>
                                    <div className='flex items-baseline gap-3 shrink-0 font-mono tabular-nums'>
                                        <span className='text-xs text-zinc-400'>
                                            {entry.points} pts
                                        </span>
                                        <span className='text-xs font-bold text-zinc-100 w-12 text-right'>
                                            {index === 0 ? 'Leader' : `-${entry.gap}`}
                                        </span>
                                    </div>
                                </div>
                                <div className='h-1 rounded-full bg-zinc-900'>
                                    {index > 0 && (
                                        <div
                                            className='h-1 rounded-full'
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: entry.color,
                                                opacity: 0.7,
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!fight.champion && (
                <p className='text-[10px] text-zinc-400 leading-relaxed'>
                    Still mathematically alive: {fight.contenders.length}
                    {hiddenAlive > 0 && ` (${hiddenAlive} not shown)`}
                    {fight.eliminated > 0 && ` · ${fight.eliminated} eliminated`}. Bar length is the
                    gap as a share of the points left, counting only the best case.
                </p>
            )}

            {canSimulate && (
                <>
                    <button
                        onClick={() => setSimulating((open) => !open)}
                        className='text-[11px] font-bold px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors'
                    >
                        {simulating ? 'Hide simulator' : 'Simulate the remaining races'}
                    </button>

                    {simulating && (
                        <TitleSimulator
                            contenders={fight.contenders.slice(0, SIMULATED_DRIVERS)}
                            rounds={rounds}
                        />
                    )}
                </>
            )}
        </div>
    );
}
