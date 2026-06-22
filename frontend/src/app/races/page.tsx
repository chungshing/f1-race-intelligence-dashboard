'use client';

import { useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import RaceWeekendCard from '@/components/table/RaceWeekendCard';
import SeasonTimeline from '@/components/dashboard/SeasonTimeline';
import { getNextRaceWeekend } from '@/utils/race';

export default function RacesPage() {
    const { data, loading, error } = useRaceWeekends();

    const nextRace = useMemo(() => getNextRaceWeekend(data || []), [data]);

    if (loading) {
        return (
            <AppLayout>
                <div className='flex items-center justify-center min-h-[50vh]'>
                    <div className='flex flex-col items-center gap-3 text-zinc-500'>
                        <div className='w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin' />
                        <p className='text-xs font-semibold uppercase tracking-wider animate-pulse'>
                            Loading Race Calendar
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !data?.length) {
        return (
            <AppLayout>
                <div className='max-w-md mx-auto text-center py-20 px-4 space-y-3'>
                    <p className='text-red-400 font-bold tracking-tight text-sm uppercase'>
                        Connection Error
                    </p>
                    <p className='text-zinc-500 text-xs'>
                        Failed to fetch the current season timeline. Please check your network
                        connection.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Sticky Next Race Callout Block */}
            <RaceWeekendCard variant='sticky' data={nextRace} />

            {/* Structured Main Content Grid */}
            <div className='max-w-7xl mx-auto px-4 py-8 space-y-8'>
                <div className='relative pl-4 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-500 before:rounded-full'>
                    <h1 className='text-2xl font-black text-white tracking-tight uppercase'>
                        Race Calendar
                    </h1>
                </div>

                <div className='bg-zinc-950/20 border border-zinc-900 rounded-2xl p-4 sm:p-6 backdrop-blur-sm'>
                    <SeasonTimeline weekends={data} />
                </div>
            </div>
        </AppLayout>
    );
}
