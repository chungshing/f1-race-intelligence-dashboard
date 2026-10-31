'use client';

import { PlacesGainedCard } from '@/components/dashboard/PlacesGainedCard';
import { PoleStatsCard } from '@/components/dashboard/PoleStatsCard';
import { ResultsMatrix } from '@/components/dashboard/ResultsMatrix';
import AppLayout from '@/components/layout/AppLayout';
import { DriverTable } from '@/components/table/DriverTable';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRaceResults } from '@/hooks/useRaceResults';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { useStandings } from '@/hooks/useStandings';
import { buildPlacesGained } from '@/lib/placesGained';
import { buildPoleStats } from '@/lib/poles';
import { getChronologicalMeetingOrder } from '@/lib/racePoints';
import { buildResultsMatrix } from '@/lib/resultsMatrix';
import { buildRecentForm } from '@/utils/form';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Tab = 'standings' | 'results' | 'stats';

const TABS: { key: Tab; label: string }[] = [
    { key: 'standings', label: 'Standings' },
    { key: 'results', label: 'Season Results' },
    { key: 'stats', label: 'Season Stats' },
];

export default function DriversPage() {
    usePageTitle('Drivers');

    const [activeTab, setActiveTab] = useState<Tab>('standings');

    const { data: standings = [], loading } = useStandings();
    const { data: allRaceRows } = useRaceResults();
    const { data: races = [] } = useRaceWeekends();

    const meetingOrder = useMemo(() => getChronologicalMeetingOrder(races), [races]);

    const formMap = useMemo(() => {
        const rows = buildRecentForm(
            allRaceRows,
            standings.map((s) => s.driverNumber)
        );
        return Object.fromEntries(rows.map((r) => [r.driverNumber, r.results]));
    }, [allRaceRows, standings]);

    const poleSummary = useMemo(
        () => buildPoleStats(allRaceRows, standings),
        [allRaceRows, standings]
    );

    const placesGained = useMemo(
        () => buildPlacesGained(allRaceRows, standings),
        [allRaceRows, standings]
    );

    const resultsMatrix = useMemo(
        () => buildResultsMatrix(allRaceRows, standings, meetingOrder),
        [allRaceRows, standings, meetingOrder]
    );

    return (
        <AppLayout>
            <div className='flex items-center justify-between mb-6'>
                <div className='relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-red-500 before:rounded-full'>
                    <span className='text-[10px] font-bold text-red-500 tracking-widest uppercase'>
                        Season Standings
                    </span>
                    <h1 className='text-3xl font-black text-white tracking-tight mt-0.5'>
                        Driver Standings
                    </h1>
                </div>
                <Link
                    href='/drivers/compare'
                    className='text-xs font-bold px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors whitespace-nowrap'
                >
                    Compare Drivers
                </Link>
            </div>

            <div className='flex space-x-6 border-b border-zinc-800/80 text-xs font-bold uppercase tracking-wider pb-px overflow-x-auto scrollbar-none mb-6'>
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-3 whitespace-nowrap transition-colors ${
                            activeTab === tab.key
                                ? 'text-red-500 border-b-2 border-red-500 font-black'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
            ) : (
                <>
                    {activeTab === 'standings' && (
                        <DriverTable standings={standings} formMap={formMap} />
                    )}
                    {activeTab === 'results' && <ResultsMatrix matrix={resultsMatrix} />}
                    {activeTab === 'stats' && (
                        <div className='space-y-6'>
                            <PoleStatsCard summary={poleSummary} />
                            <PlacesGainedCard summary={placesGained} />
                        </div>
                    )}
                </>
            )}
        </AppLayout>
    );
}
