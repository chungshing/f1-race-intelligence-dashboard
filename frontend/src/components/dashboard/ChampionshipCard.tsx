'use client';

import { TitleSimulator } from '@/components/dashboard/TitleSimulator';
import { Card, CardBody, CardHeader, CardMeta, CardNote } from '@/components/ui/Card';
import { RaceWeekend } from '@/types/race';
import { DriverStanding, Team } from '@/types/standing';
import {
    TitleEntry,
    TitleFight,
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

const ROWS = 5;
const SIMULATED_DRIVERS = 5;

function toHex(color: string) {
    return color.startsWith('#') ? color : `#${color}`;
}

function TitleSection({
    label,
    entries,
    fight,
}: {
    label: string;
    entries: TitleEntry[];
    fight: TitleFight;
}) {
    const top = [...entries].sort((a, b) => b.points - a.points).slice(0, ROWS);
    const aliveKeys = new Set(fight.contenders.map((c) => c.key));
    const leaderPoints = top[0]?.points ?? 0;

    return (
        <div className='space-y-2.5'>
            <div className='flex items-center justify-between gap-3'>
                <h4 className='text-[10px] font-bold uppercase tracking-widest text-zinc-300'>
                    {label}
                </h4>
                <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                        fight.champion ? 'text-emerald-400' : 'text-zinc-400'
                    }`}
                >
                    {fight.champion
                        ? 'Title clinched'
                        : `${fight.contenders.length} alive · ${fight.maxAvailable} pts left`}
                </span>
            </div>

            <div className='space-y-1.5'>
                {top.map((entry, index) => {
                    const isLeader = index === 0;
                    const gap = leaderPoints - entry.points;
                    const alive = aliveKeys.has(entry.key);
                    const clinched = isLeader && !!fight.champion;
                    const pct =
                        fight.maxAvailable > 0
                            ? Math.min(100, (gap / fight.maxAvailable) * 100)
                            : 0;

                    return (
                        <div
                            key={entry.key}
                            className={`rounded-lg px-2.5 py-1.5 ${
                                clinched
                                    ? 'border border-emerald-500/30 bg-emerald-500/10'
                                    : 'border border-transparent'
                            } ${!isLeader && !alive ? 'opacity-50' : ''}`}
                        >
                            <div className='flex items-center gap-2.5'>
                                <span className='font-mono text-[11px] text-zinc-400 w-3 tabular-nums'>
                                    {index + 1}
                                </span>
                                <span
                                    className='w-1 h-4 rounded-full shrink-0'
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className='text-xs font-semibold text-zinc-200 truncate flex-1 min-w-0'>
                                    {entry.name}
                                </span>
                                <span className='font-mono text-xs text-zinc-300 tabular-nums'>
                                    {entry.points}
                                </span>
                                <span
                                    className={`font-mono text-[11px] font-bold tabular-nums w-14 text-right ${
                                        clinched
                                            ? 'text-emerald-400'
                                            : isLeader
                                              ? 'text-zinc-400'
                                              : 'text-zinc-100'
                                    }`}
                                >
                                    {clinched ? 'Clinched' : isLeader ? 'Leader' : `-${gap}`}
                                </span>
                            </div>
                            {!isLeader && alive && (
                                <div className='mt-1.5 ml-8 h-1 rounded-full bg-zinc-900'>
                                    <div
                                        className='h-1 rounded-full'
                                        style={{
                                            width: `${pct}%`,
                                            backgroundColor: entry.color,
                                            opacity: 0.7,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function ChampionshipCard({ drivers, teams, races }: Props) {
    const [simulating, setSimulating] = useState(false);

    const remaining = useMemo(() => countRemainingRounds(races), [races]);
    const rounds = useMemo(() => listRemainingRounds(races), [races]);

    const driverEntries = useMemo<TitleEntry[]>(
        () =>
            drivers.map((d) => ({
                key: String(d.driverNumber),
                name: d.driverName,
                color: toHex(d.teamColor),
                points: d.points,
            })),
        [drivers]
    );

    const teamEntries = useMemo<TitleEntry[]>(
        () =>
            teams.map((t) => ({
                key: t.teamName,
                name: t.teamName,
                color: toHex(t.teamColor),
                points: t.points,
            })),
        [teams]
    );

    const driverFight = useMemo(
        () => computeTitleFight(driverEntries, 'drivers', remaining),
        [driverEntries, remaining]
    );
    const teamFight = useMemo(
        () => computeTitleFight(teamEntries, 'constructors', remaining),
        [teamEntries, remaining]
    );

    if (!driverFight && !teamFight) return null;

    const canSimulate = !!driverFight && !driverFight.champion && rounds.length > 0;

    const roundsLeft = `${remaining.races} ${remaining.races === 1 ? 'race' : 'races'}${
        remaining.sprints > 0
            ? ` + ${remaining.sprints} ${remaining.sprints === 1 ? 'sprint' : 'sprints'}`
            : ''
    } left`;

    return (
        <Card>
            <CardHeader icon={Trophy} title='Championship' right={<CardMeta>{roundsLeft}</CardMeta>} />

            <CardBody className='space-y-5'>
                {driverFight && (
                    <TitleSection label='Drivers' entries={driverEntries} fight={driverFight} />
                )}

                {canSimulate && driverFight && (
                    <div className='space-y-3'>
                        <button
                            onClick={() => setSimulating((open) => !open)}
                            className='text-[11px] font-bold px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors'
                        >
                            {simulating ? 'Hide simulator' : 'Simulate the remaining races'}
                        </button>

                        {simulating && (
                            <TitleSimulator
                                contenders={driverFight.contenders.slice(0, SIMULATED_DRIVERS)}
                                rounds={rounds}
                            />
                        )}
                    </div>
                )}

                {teamFight && (
                    <TitleSection label='Constructors' entries={teamEntries} fight={teamFight} />
                )}
            </CardBody>

            <CardNote>
                Alive means a driver or team could still catch the leader if the leader scored
                nothing from here. A constructor can score from both cars in every round.
            </CardNote>
        </Card>
    );
}
