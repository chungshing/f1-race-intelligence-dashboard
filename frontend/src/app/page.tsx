'use client';

import AppLayout from '@/components/layout/AppLayout';
import { DriverTable } from '@/components/DriverTable';
import { TeamTable } from '@/components/TeamTable';
import RaceWeekendCard from '@/components/RaceWeekendCard';
import { useStandings, useTeamStandings } from '@/hooks/useStandings';
import { useMemo, useState, useEffect } from 'react';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { getNextRaceWeekend } from '@/utils/race';
import { RaceResultsTable } from '@/components/RaceResultsTable';
import { useDriverLookup } from '@/hooks/useDriverLookup';
import { getRaceResults } from '@/lib/app';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';

type TabType = 'drivers' | 'constructors';

export default function Home() {
    const { data: standings = [], loading: driverLoading } = useStandings();
    const { data: teams = [], loading: teamLoading } = useTeamStandings();
    const { data: races = [] } = useRaceWeekends();
    const [activeTab, setActiveTab] = useState<TabType>('drivers');
    const driverLookup = useDriverLookup();


    const [mountTimestamp] = useState(() => Date.now());
    const [resultsState, setResultsState] = useState<{
        data: DriverResult[];
        loading: boolean;
    }>({ data: [], loading: true });

    const nextRace = useMemo(() => getNextRaceWeekend(races), [races]);

    const sortedRaces = useMemo(() => {
        return races
            .map((race) => {
                const raceSession = race.sessions?.find((s) => s.sessionName === 'Race');
                const raceDate = raceSession ? new Date(raceSession.dateStart) : null;
                return { ...race, raceDate };
            })
            .filter((race) => race.raceDate && race.raceDate.getTime() <= mountTimestamp)
            .toSorted((a, b) => b.raceDate!.getTime() - a.raceDate!.getTime());
    }, [races, mountTimestamp]);

    const sortedRacesKey = JSON.stringify(sortedRaces.map((r) => r.meetingKey));

    useEffect(() => {
        let isMounted = true;
        if (!sortedRaces.length) return;

        const fetchLatestCompletedRace = async () => {
            try {
                for (const race of sortedRaces) {
                    const data: SupabaseRaceResultRow[] = await getRaceResults(race.meetingKey);
                    if (!isMounted) return;

                    const mainRaceSession = data.find((s) => s.session_name === 'Race');
                    if (mainRaceSession) {
                        let rawData = mainRaceSession.classification_json;
                        if (typeof rawData === 'string') {
                            rawData = JSON.parse(rawData);
                        }

                        if (Array.isArray(rawData) && rawData.length > 0) {
                            setResultsState({
                                data: rawData as DriverResult[],
                                loading: false,
                            });
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch latest race data:', err);
            } finally {
                if (isMounted) {
                    setResultsState((prev) => ({ ...prev, loading: false }));
                }
            }
        };

        fetchLatestCompletedRace();
        return () => {
            isMounted = false;
        };
    }, [sortedRacesKey, sortedRaces.length, sortedRaces]);

    const leader = standings[0];
    const runnerUp = standings[1];
    const topTeam = teams[0];

    const statsCards = useMemo(() => {
        return [
            {
                label: 'Championship Leader',
                val: driverLoading ? null : leader?.driverName,
                sub: leader?.teamName ?? 'No Active Team',
                caption: leader?.points ? `${leader.points} PTS` : '0 PTS',
                color: leader?.teamColor ? `#${leader.teamColor}` : '#71717a',
            },
            {
                label: 'Constructor Leader',
                val: teamLoading ? null : topTeam?.teamName,
                sub: 'Factory Lead',
                caption: topTeam?.points ? `${topTeam.points} PTS` : '0 PTS',
                color: '#e4e4e7',
            },
            {
                label: 'Title Fight Gap',
                val: driverLoading
                    ? null
                    : leader && runnerUp
                      ? `+${leader.points - runnerUp.points}`
                      : '—',
                sub: 'Points Delta',
                caption: 'Top 2 Drivers',
                color: '#a1a1aa',
            },
        ];
    }, [leader, runnerUp, topTeam, driverLoading, teamLoading]);

    return (
        <AppLayout>
            <div className='space-y-5 text-zinc-100'>
                {/* HEADER WITH REINSTATED SUBTITLE */}
                <div className='mb-5'>
                    <h1 className='text-2xl font-bold text-zinc-100'>Command Hub</h1>
                    <p className='text-xs text-zinc-400 mt-1'>
                        Season telemetry and championship standings overview.
                    </p>
                </div>

                {/* COMPACT OVERVIEW STATS GRID */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                    {statsCards.map((card, i) => (
                        <div
                            key={i}
                            className='bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col justify-between'
                        >
                            <div className='flex items-center justify-between gap-2'>
                                <p className='text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate'>
                                    {card.label}
                                </p>
                                <span className='text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/30 whitespace-nowrap'>
                                    {card.caption}
                                </span>
                            </div>

                            <div className='mt-2 flex items-baseline justify-between gap-4'>
                                {card.val === null ? (
                                    <div className='h-6 w-24 bg-zinc-800 animate-pulse rounded-md' />
                                ) : (
                                    <h2 className='text-base font-bold truncate tracking-tight text-zinc-200'>
                                        {card.val || '—'}
                                    </h2>
                                )}
                                <span
                                    className='text-[10px] font-medium truncate max-w-[50%] border-l border-zinc-800 pl-2'
                                    style={{ color: card.color }}
                                >
                                    {card.sub}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* PRIMARY DASHBOARD LAYOUT GRID */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 items-start'>
                    {/* LEFT SIDEBAR: CHAMPIONSHIP TABLES */}
                    <div className='lg:col-span-2 space-y-4 bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-4 backdrop-blur-xs'>
                        <div className='flex items-center justify-between border-b border-zinc-800/60 pb-3 gap-4'>
                            <div className='flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-full max-w-60'>
                                {(['drivers', 'constructors'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-1 text-[11px] font-bold uppercase rounded-md transition-all ${
                                            activeTab === tab
                                                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                                                : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <a
                                href={activeTab === 'drivers' ? '/drivers' : '/constructors'}
                                className='text-[11px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors tracking-tight whitespace-nowrap'
                            >
                                View Full Standings →
                            </a>
                        </div>

                        <div className='w-full'>
                            {activeTab === 'drivers' ? (
                                driverLoading ? (
                                    <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                                ) : (
                                    <DriverTable standings={standings} limit={7} />
                                )
                            ) : teamLoading ? (
                                <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                            ) : (
                                <TeamTable standings={teams} limit={7} />
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR: SESSIONS & LIVE CLASSIFICATION */}
                    <div className='lg:col-span-1 lg:sticky lg:top-6 space-y-5'>
                        {/* UPCOMING EVENTS SCHEDULE */}
                        <div className='space-y-2'>
                            <h3 className='text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1'>
                                Next Race Weekend
                            </h3>
                            {nextRace ? (
                                <RaceWeekendCard variant='card' data={nextRace} />
                            ) : (
                                <div className='h-44 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                            )}
                        </div>

                        {/* HISTORIC COMPLETED CLASSIFICATIONS */}
                        <div className='space-y-2'>
                            <div className='flex items-center justify-between px-1'>
                                <h3 className='text-[10px] font-bold uppercase tracking-widest text-zinc-400'>
                                    Latest Race Results
                                </h3>

                                {sortedRaces.length > 0 && (
                                    <a
                                        href={`/races/${sortedRaces[0].meetingKey}`}
                                        className='text-[11px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors tracking-tight'
                                    >
                                        Full Session Breakdown →
                                    </a>
                                )}
                            </div>

                            {resultsState.loading ? (
                                <div className='h-64 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                            ) : resultsState.data.length > 0 ? (
                                <RaceResultsTable
                                    classification={resultsState.data}
                                    lookup={driverLookup}
                                    variant='landing'
                                />
                            ) : (
                                <div className='text-xs text-zinc-500 bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-6 text-center shadow-inner'>
                                    No completed race sessions found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
