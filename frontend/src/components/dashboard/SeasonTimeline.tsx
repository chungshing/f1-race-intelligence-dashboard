'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { RaceWeekend } from '@/types/race';
import { getNextRaceWeekend } from '@/utils/race';
import Image from 'next/image';

type Props = {
    weekends: RaceWeekend[];
};

export default function SeasonTimeline({ weekends }: Props) {
    const [openId, setOpenId] = useState<number | null>(null);
    const activeCardRef = useRef<HTMLDivElement | null>(null);

    // Pure static initialization avoids hydration mismatches
    const [clock, setClock] = useState({
        isMounted: false,
        now: 0,
    });

    // Process weekends and grab next race metadata in a single memoization pass
    const { processedWeekends, currentIndex } = useMemo(() => {
        const nextRace = getNextRaceWeekend(weekends);

        const processed = weekends
            .map((weekend) => {
                const sessions = weekend.sessions ?? [];
                if (sessions.length === 0) return null;

                const sortedSessions = [...sessions].sort(
                    (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
                );

                const lastSession = sortedSessions[sortedSessions.length - 1];

                return {
                    ...weekend,
                    sortedSessions,
                    firstSession: sortedSessions[0],
                    startTime: new Date(sortedSessions[0].dateStart).getTime(),
                    // Added a fallback switch to avoid runtime errors if dates are corrupted
                    endTime:
                        new Date(lastSession?.dateEnd || lastSession?.dateStart).getTime() +
                        10800000,
                };
            })
            .filter((w): w is NonNullable<typeof w> => w !== null);

        const index = nextRace
            ? processed.findIndex((w) => w.meetingKey === nextRace.meetingKey)
            : -1;

        return { processedWeekends: processed, currentIndex: index };
    }, [weekends]);

    // Handle standard browser clock synching
    useEffect(() => {
        const initialSync = setTimeout(() => {
            setClock({
                isMounted: true,
                now: Date.now(),
            });

            // Automatically open the current/next race card for immediate visibility
            if (currentIndex !== -1 && processedWeekends[currentIndex]) {
                setOpenId(processedWeekends[currentIndex].meetingKey);
            }
        }, 0);

        const clockInterval = setInterval(() => {
            setClock((prev) => ({
                ...prev,
                now: Date.now(),
            }));
        }, 60000);

        return () => {
            clearTimeout(initialSync);
            clearInterval(clockInterval);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Smooth scroll position directly to current item
    useEffect(() => {
        if (!clock.isMounted) return;

        const scrollTimer = setTimeout(() => {
            if (activeCardRef.current) {
                activeCardRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }, 300);

        return () => clearTimeout(scrollTimer);
    }, [clock.isMounted, currentIndex]);

    return (
        <div className='border border-zinc-800 bg-zinc-950 rounded-2xl p-6 shadow-2xl relative overflow-hidden'>
            <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xs font-black text-zinc-400 tracking-widest uppercase'>
                    2026 Season Timeline
                </h2>
                <span className='text-[10px] font-mono bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800'>
                    {processedWeekends.length} Rounds
                </span>
            </div>

            <div className='space-y-3 relative'>
                <div className='absolute left-3 top-4 bottom-4 w-px bg-zinc-800' />

                {processedWeekends.map((weekend, index) => {
                    const isLive =
                        clock.isMounted &&
                        clock.now >= weekend.startTime &&
                        clock.now <= weekend.endTime;
                    const isPast = clock.isMounted && clock.now > weekend.endTime;
                    const isFuture = !clock.isMounted || clock.now < weekend.startTime;

                    const isTargetCard = index === currentIndex;
                    const isOpen = openId === weekend.meetingKey;

                    return (
                        <div
                            key={weekend.meetingKey}
                            ref={isTargetCard ? activeCardRef : null}
                            className={`relative pl-8 transition-opacity duration-300 ${isPast && !isOpen ? 'opacity-50 hover:opacity-90' : 'opacity-100'}`}
                        >
                            {isPast && (
                                <div className='absolute left-3 top-4 h-full w-px bg-emerald-500/30 z-0' />
                            )}

                            <div
                                className={`absolute left-1.5 top-4.5 w-3 h-3 rounded-full border-2 border-zinc-950 transition-all duration-300 z-10
                                ${isLive ? 'bg-red-500 ring-4 ring-red-500/20 scale-110' : ''}
                                ${isPast ? 'bg-emerald-500' : ''}
                                ${isFuture && !isTargetCard ? 'bg-zinc-800' : ''}
                                ${isTargetCard && !isLive ? 'bg-zinc-400 ring-4 ring-zinc-500/10' : ''}`}
                            />

                            <div
                                onClick={() => setOpenId(isOpen ? null : weekend.meetingKey)}
                                className={`rounded-xl border p-3.5 transition-all duration-200 cursor-pointer backdrop-blur-xs select-none
                                    ${isLive ? 'border-red-500/30 bg-red-950/10 shadow-lg shadow-red-950/20' : ''}
                                    ${isTargetCard && !isLive ? 'border-zinc-700 bg-zinc-900/40' : ''}
                                    ${!isTargetCard && !isLive ? 'border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 hover:bg-zinc-900/30' : ''}`}
                            >
                                <div className='flex justify-between items-center gap-4'>
                                    <div className='min-w-0 flex items-center gap-2.5'>
                                        {/* Row Country Flag integration */}
                                        {weekend.countryFlag && (
                                            <div className='relative w-5 h-3.5 rounded-xs overflow-hidden border border-zinc-800/60 shrink-0'>
                                                <Image
                                                    src={weekend.countryFlag}
                                                    alt={weekend.country}
                                                    fill
                                                    sizes='20px'
                                                    className='object-cover'
                                                />
                                            </div>
                                        )}
                                        <div className='min-w-0'>
                                            <h3 className='font-bold text-sm tracking-tight text-zinc-100 truncate'>
                                                {weekend.country}
                                            </h3>
                                            <p className='text-xs text-zinc-500 truncate mt-0.5'>
                                                {weekend.circuit}
                                            </p>
                                        </div>
                                    </div>

                                    <div className='text-right shrink-0'>
                                        <p
                                            className='text-xs font-mono font-semibold text-zinc-400'
                                            suppressHydrationWarning
                                        >
                                            {new Date(
                                                weekend.firstSession.dateStart,
                                            ).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                            })}
                                        </p>

                                        {clock.isMounted && (
                                            <div className='mt-0.5'>
                                                {isLive && (
                                                    <span className='text-[9px] font-black text-red-400 uppercase tracking-widest animate-pulse'>
                                                        ● Live
                                                    </span>
                                                )}
                                                {isPast && (
                                                    <span className='text-[9px] font-bold text-emerald-500 uppercase tracking-wider'>
                                                        Done
                                                    </span>
                                                )}
                                                {isFuture && isTargetCard && (
                                                    <span className='text-[9px] font-bold text-zinc-950 bg-zinc-200 px-1 py-px rounded-xs uppercase tracking-wider'>
                                                        Next Up
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className='mt-3.5 border-t border-zinc-900 pt-3 space-y-3'>
                                        {/* Expanded Row Subtitle Layout Badge + Mini Map Grid Split */}
                                        <div className='flex justify-between items-center bg-zinc-950 border border-zinc-900/60 p-2.5 rounded-lg gap-4'>
                                            <div className='space-y-0.5'>
                                                <span className='text-[9px] font-bold text-zinc-500 uppercase tracking-wider block'>
                                                    Track Layout
                                                </span>
                                                <span className='text-[11px] font-semibold text-zinc-300 tracking-tight uppercase'>
                                                    {weekend.circuitType || 'Standard'} Circuit
                                                </span>
                                            </div>
                                            {weekend.circuitImage && (
                                                <div className='relative w-12 h-8 opacity-40 shrink-0 select-none'>
                                                    <Image
                                                        src={weekend.circuitImage}
                                                        alt={weekend.circuit}
                                                        fill
                                                        sizes='48px'
                                                        className='object-contain inverted'
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className='space-y-2.5'>
                                            {weekend.sortedSessions.map((s) => {
                                                const sessionStart = new Date(
                                                    s.dateStart,
                                                ).getTime();
                                                const sessionEnd = new Date(s.dateEnd).getTime();
                                                const isSessionPast =
                                                    clock.isMounted && clock.now > sessionEnd;
                                                const isSessionLive =
                                                    clock.isMounted &&
                                                    clock.now >= sessionStart &&
                                                    clock.now <= sessionEnd;

                                                return (
                                                    <div
                                                        key={s.sessionName}
                                                        className='flex justify-between items-center text-xs px-1'
                                                    >
                                                        <span
                                                            className={`font-medium ${isSessionLive ? 'text-red-400' : isSessionPast ? 'text-zinc-500' : 'text-zinc-400'}`}
                                                        >
                                                            {s.sessionName}
                                                        </span>
                                                        <span
                                                            className={`font-mono text-[11px] ${isSessionLive ? 'text-red-400 font-bold' : 'text-zinc-500'}`}
                                                            suppressHydrationWarning
                                                        >
                                                            {isSessionLive
                                                                ? 'LIVE'
                                                                : new Date(
                                                                      s.dateStart,
                                                                  ).toLocaleString('en-GB', {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                      hour12: false,
                                                                  })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {!isFuture && (
                                            <a
                                                href={`/races/${weekend.meetingKey}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className='block mt-2 w-full text-center text-xs font-bold py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg transition-colors'
                                            >
                                                {isLive
                                                    ? 'Enter Live Dashboard'
                                                    : 'View Weekend Results'}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
