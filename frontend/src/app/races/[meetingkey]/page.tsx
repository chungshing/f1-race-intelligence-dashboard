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

    const countryName = results[0]?.country || 'Race Weekend';

    if (loading) {
        return (
            <AppLayout>
                <div className='flex items-center justify-center min-h-[50vh]'>
                    <div className='flex flex-col items-center gap-3 text-zinc-500'>
                        <div className='w-6 h-6 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin' />
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
                        <p className='text-zinc-500 text-xs leading-relaxed'>
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
            <div className='max-w-5xl mx-auto px-4 py-8 space-y-8'>
                <div className='relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-blue-500 before:rounded-full'>
                    <span className='text-[10px] font-bold text-blue-500 tracking-widest uppercase'>
                        Grand Prix Results
                    </span>
                    <h1 className='text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5'>
                        {countryName}
                    </h1>
                </div>

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

                {activeRace && (
                    <section className='animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out'>
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
