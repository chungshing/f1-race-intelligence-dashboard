'use client';

import { LapHeatmapGrid } from '@/components/chart/LapHeatmapGrid';
import { LapPaceChart } from '@/components/chart/LapPaceChart';
import { PaceConsistencyCard } from '@/components/chart/PaceConsistencyCard';
import { PitStopLeaderboard } from '@/components/chart/PitStopLeaderboard';
import { PositionByLapChart } from '@/components/chart/PositionByLapChart';
import { RaceControlPanel } from '@/components/chart/RaceControlPanel';
import { TyreDegradationCard } from '@/components/chart/TyreDegradationCard';
import { WeatherPanel } from '@/components/chart/WeatherPanel';
import { RaceSummaryChips } from '@/components/dashboard/RaceSummaryChips';
import AppLayout from '@/components/layout/AppLayout';
import { GridVsRaceUnavailable, GridVsRaceView } from '@/components/table/GridVsRaceView';
import { RaceResultsTable } from '@/components/table/RaceResultsTable';
import { RaceStrategyTable } from '@/components/table/RaceStrategyTable';
import { SectorDurationTable } from '@/components/table/SectorDurationTable';
import { SectorSpeedTable } from '@/components/table/SectorSpeedTable';
import { TabBar } from '@/components/ui/tabbar';
import { useDriverLookup } from '@/hooks/useDriverLookup';
import { useMeetingResults } from '@/hooks/useMeetingResults';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSessionLaps } from '@/hooks/useSessionLaps';
import {
    DriverResult,
    RaceControlEvent,
    RaceResult,
    StartingGridEntry,
    WeatherSnapshot,
} from '@/types/results';
import { parseJsonField } from '@/utils/form';
import { findGridRacePairs, isGridRaceSession, pickGridRacePair } from '@/utils/gridVsRace';
import { buildRaceSummary } from '@/utils/raceSummary';
import { use, useEffect, useMemo, useRef, useState } from 'react';

type ActiveTab = 'classification' | 'strategy' | 'pace' | 'racecontrol';

const TABS = [
    {
        key: 'classification' as const,
        label: 'Results',
        requiresLaps: false,
        requiresStints: false,
    },
    { key: 'strategy' as const, label: 'Race Strategy', requiresLaps: false, requiresStints: true },
    { key: 'pace' as const, label: 'Pace', requiresLaps: true, requiresStints: false },
    {
        key: 'racecontrol' as const,
        label: 'Race Control',
        requiresLaps: false,
        requiresStints: false,
        requiresRaceControl: true,
    },
];

export default function RacePage({ params }: { params: Promise<{ meetingkey: string }> }) {
    const { meetingkey } = use(params);
    const driverLookup = useDriverLookup();

    const { data: rows, loading } = useMeetingResults(Number(meetingkey));

    const results = useMemo<RaceResult[]>(
        () =>
            rows
                .map((r) => ({
                    sessionKey: r.session_key,
                    meetingKey: r.meeting_key,
                    country: r.country,
                    sessionName: r.session_name,
                    classification: parseJsonField<DriverResult>(r.classification_json),
                    pitStops: parseJsonField(r.pit_stops_json),
                    stints: parseJsonField(r.stints_json),
                    weather: parseJsonField<WeatherSnapshot>(r.weather_json),
                    raceControl: parseJsonField<RaceControlEvent>(r.race_control_json),
                    startingGrid: parseJsonField<StartingGridEntry>(r.starting_grid_json),
                }))
                .sort((a, b) => a.sessionKey - b.sessionKey),
        [rows]
    );

    const [activeSessionKey, setActiveSessionKey] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('classification');
    const initialised = useRef(false);

    const { data: activeSessionLaps } = useSessionLaps(activeSessionKey ?? 0);
    const hasLapData = activeSessionLaps.length > 0;

    // Pick the starting session and tab (from the URL if present) once results arrive
    useEffect(() => {
        if (initialised.current || results.length === 0) return;
        initialised.current = true;

        const search = new URLSearchParams(window.location.search);
        const requestedSession = Number(search.get('session'));
        const requestedTab = TABS.find((t) => t.key === search.get('tab'))?.key;

        const initial =
            results.find((r) => r.sessionKey === requestedSession) ?? results[results.length - 1];

        queueMicrotask(() => {
            setActiveSessionKey(initial.sessionKey);
            if (requestedTab) setActiveTab(requestedTab);
        });
    }, [results]);

    // Keep the URL in sync so refresh and shared links open the same view
    useEffect(() => {
        if (loading || activeSessionKey == null) return;
        window.history.replaceState(null, '', `?session=${activeSessionKey}&tab=${activeTab}`);
    }, [loading, activeSessionKey, activeTab]);

    const activeRace = useMemo(() => {
        return results.find((r) => r.sessionKey === activeSessionKey);
    }, [results, activeSessionKey]);

    const hasStintData = (activeRace?.stints?.length ?? 0) > 0;

    const hasRaceControlData = (activeRace?.raceControl?.length ?? 0) > 0;

    const gridRacePairs = useMemo(() => findGridRacePairs(results), [results]);

    const isGridSession = !!activeRace && isGridRaceSession(activeRace.sessionName);

    const activeGridPair = useMemo(
        () => (activeRace ? pickGridRacePair(gridRacePairs, activeRace.sessionName) : undefined),
        [gridRacePairs, activeRace]
    );

    const visibleTabs = TABS.filter(
        (tab) =>
            (!tab.requiresLaps || hasLapData) &&
            (!tab.requiresStints || hasStintData) &&
            (!tab.requiresRaceControl || hasRaceControlData)
    );

    const countryName = results[0]?.country || 'Race Weekend';
    usePageTitle(countryName);

    if (loading) {
        return (
            <AppLayout>
                <div className='flex items-center justify-center min-h-[50vh]'>
                    <div className='flex flex-col items-center gap-3 text-zinc-400'>
                        <div className='w-6 h-6 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin' />
                        <p className='text-xs font-semibold uppercase tracking-wider animate-pulse'>
                            Loading Weekend Results
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (results.length === 0) {
        return (
            <AppLayout>
                <div className='max-w-md mx-auto text-center py-20 px-4 space-y-4'>
                    <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xl'>
                        ?
                    </div>
                    <div className='space-y-1.5'>
                        <p className='text-zinc-200 font-bold tracking-tight'>No data available</p>
                        <p className='text-zinc-400 text-xs leading-relaxed'>
                            Results for this race weekend haven&apos;t been published or loaded yet.
                            Check back once track sessions finish!
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className='space-y-6'>
                <div className='relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-red-500 before:rounded-full'>
                    <span className='text-[10px] font-bold text-red-500 tracking-widest uppercase'>
                        Grand Prix Results
                    </span>
                    <h1 className='text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5'>
                        {countryName}
                    </h1>
                </div>

                {/* Session Select Bar */}
                <div className='bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-1 backdrop-blur-md shadow-inner'>
                    <div
                        role='group'
                        aria-label='Sessions'
                        className='flex gap-1 overflow-x-auto scrollbar-none snap-x'
                    >
                        {results.map((race) => {
                            const isActive = activeSessionKey === race.sessionKey;
                            return (
                                <button
                                    key={race.sessionKey}
                                    aria-pressed={isActive}
                                    onClick={() => {
                                        setActiveSessionKey(race.sessionKey);
                                        setActiveTab('classification');
                                    }}
                                    className={`snap-center px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/60'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                                    }`}
                                >
                                    {race.sessionName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* View State Navigation Tabs */}
                <TabBar
                    tabs={visibleTabs}
                    active={activeTab}
                    onChange={setActiveTab}
                    label='Race views'
                    idPrefix='race'
                />

                {/* Render Selection Context */}
                {activeRace && (
                    <section
                        role='tabpanel'
                        id='race-panel'
                        aria-labelledby={`race-tab-${activeTab}`}
                        className='animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out'
                    >
                        {activeTab === 'classification' && (
                            <div className='space-y-6'>
                                {isGridSession && (
                                    <RaceSummaryChips
                                        summary={buildRaceSummary(
                                            activeRace.classification,
                                            activeRace.raceControl,
                                            activeRace.weather
                                        )}
                                    />
                                )}
                                <WeatherPanel weather={activeRace.weather} />
                                <RaceResultsTable
                                    classification={activeRace.classification}
                                    lookup={driverLookup}
                                    sessionName={activeRace.sessionName}
                                />
                                {activeGridPair && (
                                    <>
                                        <GridVsRaceView
                                            pairs={gridRacePairs}
                                            lookup={driverLookup}
                                            activeSessionName={activeRace.sessionName}
                                        />
                                        <PositionByLapChart
                                            key={activeRace.sessionKey}
                                            sessionKey={activeRace.sessionKey}
                                            driversList={activeRace.classification}
                                            grid={activeGridPair.grid}
                                            lookup={driverLookup}
                                            raceControl={activeRace.raceControl}
                                        />
                                    </>
                                )}
                                {isGridSession && !activeGridPair && (
                                    <GridVsRaceUnavailable results={results} />
                                )}
                            </div>
                        )}
                        {activeTab === 'racecontrol' && (
                            <RaceControlPanel raceControl={activeRace.raceControl} />
                        )}
                        {activeTab === 'strategy' && (
                            <div className='space-y-6'>
                                <RaceStrategyTable
                                    pitStops={activeRace.pitStops}
                                    stints={activeRace.stints}
                                    lookup={driverLookup}
                                    results={activeRace.classification}
                                    raceControl={activeRace.raceControl}
                                />
                                <PitStopLeaderboard
                                    pitStops={activeRace.pitStops}
                                    lookup={driverLookup}
                                />
                            </div>
                        )}
                        {activeTab === 'pace' && (
                            <div className='space-y-6'>
                                <LapHeatmapGrid
                                    sessionKey={activeRace.sessionKey}
                                    driversList={activeRace.classification}
                                    lookup={driverLookup}
                                />
                                <LapPaceChart
                                    sessionKey={activeRace.sessionKey}
                                    driversList={activeRace.classification}
                                    lookup={driverLookup}
                                    raceControl={activeRace.raceControl}
                                />
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch '>
                                    <SectorDurationTable
                                        sessionKey={activeRace.sessionKey}
                                        driversList={activeRace.classification}
                                        lookup={driverLookup}
                                    />
                                    <SectorSpeedTable
                                        sessionKey={activeRace.sessionKey}
                                        lookup={driverLookup}
                                    />
                                </div>
                                <PaceConsistencyCard
                                    sessionKey={activeRace.sessionKey}
                                    lookup={driverLookup}
                                    raceControl={activeRace.raceControl}
                                />
                            </div>
                        )}
                        {isGridSession && (
                            <TyreDegradationCard
                                sessionKey={activeRace.sessionKey}
                                stints={activeRace.stints}
                                raceControl={activeRace.raceControl}
                            />
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
