'use client';

import { LapHeatmapGrid } from '@/components/chart/LapHeatmapGrid';
import { LapPaceChart } from '@/components/chart/LapPaceChart';
import { PaceConsistencyCard } from '@/components/chart/PaceConsistencyCard';
import { PitStopLeaderboard } from '@/components/chart/PitStopLeaderboard';
import { RaceControlPanel } from '@/components/chart/RaceControlPanel';
import { WeatherPanel } from '@/components/chart/WeatherPanel';
import AppLayout from '@/components/layout/AppLayout';
import { GridVsRaceUnavailable, GridVsRaceView } from '@/components/table/GridVsRaceView';
import { RaceResultsTable } from '@/components/table/RaceResultsTable';
import { RaceStrategyTable } from '@/components/table/RaceStrategyTable';
import { SectorDurationTable } from '@/components/table/SectorDurationTable';
import { SectorSpeedTable } from '@/components/table/SectorSpeedTable';
import { useDriverLookup } from '@/hooks/useDriverLookup';
import { getLapsBySession, getRaceResults } from '@/lib/app';
import {
    DriverResult,
    RaceControlEvent,
    RaceResult,
    SupabaseRaceResultRow,
    WeatherSnapshot,
} from '@/types/results';
import { findGridRacePairs } from '@/utils/gridVsRace';
import { use, useEffect, useMemo, useState } from 'react';

type ActiveTab =
    | 'classification'
    | 'gridvsrace'
    | 'strategy'
    | 'racecontrol'
    | 'telemetry'
    | 'performance';

const TABS = [
    {
        key: 'classification' as const,
        label: 'Classification',
        requiresLaps: false,
        requiresStints: false,
    },
    {
        key: 'gridvsrace' as const,
        label: 'Grid vs Race',
        requiresLaps: false,
        requiresStints: false,
    },
    { key: 'strategy' as const, label: 'Race Strategy', requiresLaps: false, requiresStints: true },
    {
        key: 'racecontrol' as const,
        label: 'Race Control',
        requiresLaps: false,
        requiresStints: false,
        requiresRaceControl: true,
    },
    {
        key: 'telemetry' as const,
        label: 'Lap Telemetry',
        requiresLaps: true,
        requiresStints: false,
    },
    {
        key: 'performance' as const,
        label: 'Performance',
        requiresLaps: true,
        requiresStints: false,
    },
];

const parseJsonField = <T,>(field: string | T[] | undefined): T[] => {
    if (!field) return [];
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch {
            return [];
        }
    }
    return Array.isArray(field) ? field : [];
};

export default function RacePage({ params }: { params: Promise<{ meetingkey: string }> }) {
    const { meetingkey } = use(params);
    const driverLookup = useDriverLookup();

    const [results, setResults] = useState<RaceResult[]>([]);
    const [activeSessionKey, setActiveSessionKey] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('classification');
    const [hasLapData, setHasLapData] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        getRaceResults(Number(meetingkey)).then((data: SupabaseRaceResultRow[]) => {
            if (!isMounted) return;

            const normalizedResults: RaceResult[] = data
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
                }))
                .sort((a, b) => a.sessionKey - b.sessionKey);

            setResults(normalizedResults);

            if (normalizedResults.length > 0) {
                setActiveSessionKey(normalizedResults[normalizedResults.length - 1].sessionKey);
            }
            setLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, [meetingkey]);

    // Reset tab and check lap data when session changes
    useEffect(() => {
        if (!activeSessionKey) return;

        queueMicrotask(() => {
            setActiveTab((tab) => (tab === 'gridvsrace' ? tab : 'classification'));
            setHasLapData(false);
        });

        getLapsBySession(activeSessionKey)
            .then((laps) => setHasLapData(laps.length > 0))
            .catch(() => setHasLapData(false));
    }, [activeSessionKey]);

    const activeRace = useMemo(() => {
        return results.find((r) => r.sessionKey === activeSessionKey);
    }, [results, activeSessionKey]);

    const hasStintData = (activeRace?.stints?.length ?? 0) > 0;

    const hasRaceControlData = (activeRace?.raceControl?.length ?? 0) > 0;

    const gridRacePairs = useMemo(() => findGridRacePairs(results), [results]);

    const visibleTabs = TABS.filter(
        (tab) =>
            (!tab.requiresLaps || hasLapData) &&
            (!tab.requiresStints || hasStintData) &&
            (!tab.requiresRaceControl || hasRaceControlData)
    );

    const countryName = results[0]?.country || 'Race Weekend';

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
                    <div className='flex gap-1 overflow-x-auto scrollbar-none snap-x'>
                        {results.map((race) => {
                            const isActive = activeSessionKey === race.sessionKey;
                            return (
                                <button
                                    key={race.sessionKey}
                                    onClick={() => setActiveSessionKey(race.sessionKey)}
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
                <div className='flex space-x-6 border-b border-zinc-800/80 text-xs font-bold uppercase tracking-wider pb-px overflow-x-auto scrollbar-none'>
                    {visibleTabs.map((tab) => (
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

                {/* Render Selection Context */}
                {activeRace && (
                    <section className='animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out'>
                        {activeTab === 'classification' && (
                            <div className='space-y-6'>
                                <WeatherPanel weather={activeRace.weather} />
                                <RaceResultsTable
                                    classification={activeRace.classification}
                                    lookup={driverLookup}
                                    sessionName={activeRace.sessionName}
                                />
                            </div>
                        )}
                        {activeTab === 'gridvsrace' &&
                            (gridRacePairs.length > 0 ? (
                                <GridVsRaceView pairs={gridRacePairs} lookup={driverLookup} />
                            ) : (
                                <GridVsRaceUnavailable results={results} />
                            ))}
                        {activeTab === 'racecontrol' && (
                            <RaceControlPanel raceControl={activeRace.raceControl} />
                        )}
                        {activeTab === 'strategy' && (
                            <RaceStrategyTable
                                pitStops={activeRace.pitStops}
                                stints={activeRace.stints}
                                lookup={driverLookup}
                                results={activeRace.classification}
                            />
                        )}
                        {activeTab === 'telemetry' && (
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
                                />
                            </div>
                        )}
                        {activeTab === 'performance' && (
                            <div className='space-y-6'>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch '>
                                    <PitStopLeaderboard
                                        pitStops={activeRace.pitStops}
                                        lookup={driverLookup}
                                    />
                                    <SectorDurationTable
                                        sessionKey={activeRace.sessionKey}
                                        driversList={activeRace.classification}
                                        lookup={driverLookup}
                                    />
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch '>
                                    <SectorSpeedTable
                                        sessionKey={activeRace.sessionKey}
                                        lookup={driverLookup}
                                    />
                                    <PaceConsistencyCard
                                        sessionKey={activeRace.sessionKey}
                                        lookup={driverLookup}
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
