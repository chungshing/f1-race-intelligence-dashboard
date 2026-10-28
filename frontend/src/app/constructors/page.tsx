'use client';

import { QualiPaceCard } from '@/components/dashboard/QualiPaceCard';
import AppLayout from '@/components/layout/AppLayout';
import { TeamTable } from '@/components/table/TeamTable';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRaceResults } from '@/hooks/useRaceResults';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { useStandings, useTeamStandings } from '@/hooks/useStandings';
import { getChronologicalMeetingOrder } from '@/lib/racePoints';
import { useMemo } from 'react';

export default function ConstructorsPage() {
    usePageTitle('Constructors');

    const { data: teams = [], loading } = useTeamStandings();
    const { data: drivers = [] } = useStandings();
    const { data: allRaceRows } = useRaceResults();
    const { data: races = [] } = useRaceWeekends();

    const meetingOrder = useMemo(() => getChronologicalMeetingOrder(races), [races]);

    return (
        <AppLayout>
            <div className='relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-red-500 before:rounded-full mb-6'>
                <span className='text-[10px] font-bold text-red-500 tracking-widest uppercase'>
                    Season Standings
                </span>
                <h1 className='text-3xl font-black text-white tracking-tight mt-0.5'>
                    Constructor Standings
                </h1>
            </div>
            {loading ? (
                <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
            ) : (
                <div className='space-y-6'>
                    <TeamTable standings={teams} />
                    <QualiPaceCard
                        rows={allRaceRows}
                        drivers={drivers}
                        meetingOrder={meetingOrder}
                    />
                </div>
            )}
        </AppLayout>
    );
}
