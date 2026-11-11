'use client';

import { PlacesGainedCard } from '@/components/dashboard/PlacesGainedCard';
import { PoleStatsCard } from '@/components/dashboard/PoleStatsCard';
import { ResultsMatrix } from '@/components/dashboard/ResultsMatrix';
import AppLayout from '@/components/layout/AppLayout';
import { DriverTable } from '@/components/table/DriverTable';
import { TabBar } from '@/components/ui/TabBar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRaceResults } from '@/hooks/useRaceResults';
import { useRaceWeekends } from '@/hooks/useRaceWeekends';
import { useStandings } from '@/hooks/useStandings';
import { buildPlacesGained } from '@/lib/placesGained';
import { buildPoleStats } from '@/lib/poles';
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
        () => buildResultsMatrix(allRaceRows, standings, races),
        [allRaceRows, standings, races]
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

            <TabBar
                tabs={TABS}
                active={activeTab}
                onChange={setActiveTab}
                label='Driver views'
                idPrefix='drivers'
                className='mb-6'
            />

            <div role='tabpanel' id='drivers-panel' aria-labelledby={`drivers-tab-${activeTab}`}>
                {loading ? (
                    <div className='h-96 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse' />
                ) : (
                    <>
                        {activeTab === 'standings' && (
                            <DriverTable standings={standings} formMap={formMap} />
                        )}
                        {activeTab === 'results' && <ResultsMatrix matrix={resultsMatrix} />}
                        {activeTab === 'stats' && (
                            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch'>
                                <div className='flex flex-col *:flex-1'>
                                    <PoleStatsCard summary={poleSummary} />
                                </div>
                                <div className='flex flex-col *:flex-1'>
                                    <PlacesGainedCard summary={placesGained} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
