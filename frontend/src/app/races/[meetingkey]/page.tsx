'use client';

import { useEffect, useState, use, useMemo } from 'react';
import { getRaceResults } from '@/lib/app';
import { useDriverLookup } from '@/hooks/useDriverLookup';
import { RaceResultsTable } from '@/components/RaceResultsTable';
import { RaceResult, SupabaseRaceResultRow } from '@/types/results';
import AppLayout from '@/components/layout/AppLayout';

export default function RacePage({ params }: { params: Promise<{ meetingkey: string }> }) {
    const { meetingkey } = use(params);
    const driverLookup = useDriverLookup();

    const [results, setResults] = useState<RaceResult[]>([]);
    const [activeSessionKey, setActiveSessionKey] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        getRaceResults(Number(meetingkey)).then((data: SupabaseRaceResultRow[]) => {
            if (!isMounted) return;

            const normalizedResults: RaceResult[] = data.map((r) => {
                let classification = r.classification_json;

                if (typeof classification === 'string') {
                    try {
                        classification = JSON.parse(classification);
                    } catch {
                        classification = [];
                    }
                }

                return {
                    sessionKey: r.session_key,
                    meetingKey: r.meeting_key,
                    country: r.country,
                    sessionName: r.session_name,
                    classification: Array.isArray(classification) ? classification : [],
                };
            });

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

    const activeRace = useMemo(() => {
        return results.find((r) => r.sessionKey === activeSessionKey);
    }, [results, activeSessionKey]);

    // Extract core metadata context safely upfront
    const countryName = results[0]?.country || 'Race Weekend';

    if (loading) {
        return (
            <AppLayout>
                <div className='p-12 text-center text-sm font-medium text-zinc-500 animate-pulse'>
                    Loading weekend results...
                </div>
            </AppLayout>
        );
    }

    if (results.length === 0) {
        return (
            <AppLayout>
                <div className='p-12 text-center max-w-md mx-auto space-y-3'>
                    <p className='text-zinc-200 font-bold'>No data available</p>
                    <p className='text-zinc-500 text-xs'>
                        Results for this race weekend haven&apos;t been published or loaded yet.
                        Check back once track sessions finish!
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className='p-6 max-w-5xl mx-auto space-y-6'>
                {/* Header */}
                <div className='border-l-4 border-blue-500 pl-4 mb-8'>
                    <h1 className='text-4xl font-black text-white tracking-tight'>
                        {countryName} Grand Prix
                    </h1>
                </div>

                {/* Tabs */}
                <div className='bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-1.5 backdrop-blur-sm'>
                    <div className='flex space-x-1 overflow-x-auto no-scrollbar'>
                        {results.map((race) => {
                            const isActive = activeSessionKey === race.sessionKey;
                            return (
                                <button
                                    key={race.sessionKey}
                                    onClick={() => setActiveSessionKey(race.sessionKey)}
                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'bg-zinc-800 text-white shadow-sm shadow-black/20 border border-zinc-700/50'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                                    }`}
                                >
                                    {race.sessionName}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Container */}
                {activeRace && (
                    <section className='animate-in fade-in slide-in-from-bottom-2 duration-300'>
                        <RaceResultsTable
                            classification={activeRace.classification}
                            lookup={driverLookup}
                        />
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
