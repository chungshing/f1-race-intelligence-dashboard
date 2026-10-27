'use client';

import { LastRaceRecap } from '@/components/dashboard/LastRaceRecap';
import { PointsProgressionChart } from '@/components/dashboard/PointsProgressionChart';
import { TitleFightCard } from '@/components/dashboard/TitleFightCard';
import AppLayout from '@/components/layout/AppLayout';
import { DriverTable } from '@/components/table/DriverTable';
import RaceWeekendCard from '@/components/table/RaceWeekendCard';
import { TeamTable } from '@/components/table/TeamTable';
import { useDriverLookup } from '@/hooks/useDriverLookup';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRaceResults } from '@/hooks/useRaceResults';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { useStandings, useTeamStandings } from '@/hooks/useStandings';
import { buildPointsProgression } from '@/lib/pointsProgression';
import { DriverResult } from '@/types/results';
import { buildRecentForm, parseJsonField } from '@/utils/form';
import { getNextRaceWeekend } from '@/utils/race';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type TabType = 'drivers' | 'constructors';

export default function Home() {
    usePageTitle();

    const { data: standings = [], loading: driverLoading } = useStandings();
    const { data: teams = [], loading: teamLoading } = useTeamStandings();
    const { data: races = [] } = useRaceWeekends();
    const [activeTab, setActiveTab] = useState<TabType>('drivers');
    const driverLookup = useDriverLookup();

    const { data: allRaceRows, loading: rowsLoading } = useRaceResults();
    const [mountTimestamp] = useState(() => Date.now());

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

    const progression = useMemo(() => {
        if (standings.length === 0 || allRaceRows.length === 0 || races.length === 0) {
            return { series: [], points: [] };
        }
        return buildPointsProgression(standings.slice(0, 5), allRaceRows, races);
    }, [standings, allRaceRows, races]);

    // Wake Render from cold sleep
    useEffect(() => {
        fetch('https://f1-race-intelligence-dashboard.onrender.com/api/health').catch(() => null);
    }, []);

    // Most recent race that actually has a classification
    const latestRace = useMemo(() => {
        for (const race of sortedRaces) {
            const raceSession = allRaceRows.find(
                (r) => r.meeting_key === race.meetingKey && r.session_name === 'Race'
            );
            if (!raceSession) continue;

            if (parseJsonField<DriverResult>(raceSession.classification_json).length > 0) {
                return race;
            }
        }
        return null;
    }, [allRaceRows, sortedRaces]);

    const formMap = useMemo(() => {
        const rows = buildRecentForm(
            allRaceRows,
            standings.map((s) => s.driverNumber)
        );
        return Object.fromEntries(rows.map((r) => [r.driverNumber, r.results]));
    }, [allRaceRows, standings]);

    return (
        <AppLayout>
            <div className='space-y-5 text-zinc-100'>
                {/* Header */}
                <div className='mb-5 flex items-center justify-between border-b border-zinc-800/40 pb-4'>
                    <div>
                        <h1 className='text-2xl font-bold text-zinc-100'>Command Hub</h1>
                        <p className='text-xs text-zinc-400 mt-1'>
                            Season telemetry and championship standings overview.
                        </p>
                    </div>
                </div>

                {/* Last Race Recap */}
                {rowsLoading ? (
                    <div className='h-52 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                ) : (
                    latestRace && (
                        <LastRaceRecap
                            meetingKey={latestRace.meetingKey}
                            country={latestRace.country}
                            lookup={driverLookup}
                        />
                    )
                )}

                {!driverLoading && !teamLoading && races.length > 0 && (
                    <TitleFightCard drivers={standings} teams={teams} races={races} />
                )}

                {/* Main Grid */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 items-start'>
                    {/* Left: Standings */}
                    <div className='lg:col-span-2 space-y-4'>
                        <div className='flex items-center justify-between border-b border-zinc-800/60 pb-3 gap-4'>
                            <div className='flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-full max-w-60'>
                                {(['drivers', 'constructors'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-1 text-[11px] font-bold uppercase rounded-md transition-all ${
                                            activeTab === tab
                                                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                                                : 'text-zinc-400 hover:text-zinc-300'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <Link
                                href={activeTab === 'drivers' ? '/drivers' : '/constructors'}
                                className='text-[11px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors tracking-tight whitespace-nowrap'
                            >
                                View Full Standings →
                            </Link>
                        </div>

                        <div className='w-full'>
                            {activeTab === 'drivers' ? (
                                driverLoading ? (
                                    <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                                ) : (
                                    <DriverTable
                                        standings={standings}
                                        limit={10}
                                        formMap={formMap}
                                    />
                                )
                            ) : teamLoading ? (
                                <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                            ) : (
                                <TeamTable standings={teams} />
                            )}
                        </div>
                    </div>

                    {/* Right: Next Race Weekend */}
                    <div className='lg:col-span-1 lg:sticky lg:top-6 space-y-2'>
                        <h3 className='text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1'>
                            Next Race Weekend
                        </h3>
                        {nextRace ? (
                            <RaceWeekendCard variant='card' data={nextRace} />
                        ) : (
                            <div className='h-44 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                        )}
                    </div>
                </div>

                {/* Points Progression Chart */}
                <div className='bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4'>
                    <h3 className='text-sm font-bold text-zinc-300 mb-2'>Championship Battle</h3>
                    <PointsProgressionChart
                        series={progression.series}
                        points={progression.points}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
