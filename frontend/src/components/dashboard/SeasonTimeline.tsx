"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { RaceWeekend } from "@/types/race";
import { getNextRaceWeekend } from "@/utils/race";

type Props = {
    weekends: RaceWeekend[];
};

export default function SeasonTimeline({ weekends }: Props) {
    const nextRace = getNextRaceWeekend(weekends);
    const [openId, setOpenId] = useState<number | null>(null);
    const activeCardRef = useRef<HTMLDivElement | null>(null);

    // Initial safe render state to prevent hydration mismatches
    const [now, setNow] = useState<number | null>(null);

    // Memoize timeline properties transformation mapping step to minimize hot path computation overhead
    const processedWeekends = useMemo(() => {
        return weekends
            .map((weekend) => {
                const sessions = weekend.sessions ?? [];
                if (sessions.length === 0) return null;

                const sortedSessions = [...sessions].sort(
                    (a, b) =>
                        new Date(a.dateStart).getTime() -
                        new Date(b.dateStart).getTime(),
                );

                const firstSession = sortedSessions[0];
                const lastSession = sortedSessions[sortedSessions.length - 1];

                const startTime = new Date(firstSession.dateStart).getTime();
                const endTime =
                    new Date(lastSession.dateEnd).getTime() + 10800000;

                return {
                    ...weekend,
                    sortedSessions,
                    firstSession,
                    startTime,
                    endTime,
                };
            })
            .filter(Boolean);
    }, [weekends]);

    useEffect(() => {
        // Wrap initial state call in a timeout to break synchronous execution path
        const initTimer = setTimeout(() => {
            setNow(Date.now());
        }, 0);

        // Update ticker every 60 seconds to keep live states fully reactive
        const clockInterval = setInterval(() => {
            setNow(Date.now());
        }, 60000);

        const scrollTimer = setTimeout(() => {
            if (activeCardRef.current) {
                activeCardRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        }, 200);

        return () => {
            clearTimeout(initTimer);
            clearInterval(clockInterval);
            clearTimeout(scrollTimer);
        };
    }, []);

    const currentIndex = nextRace
        ? processedWeekends.findIndex(
              (w) => w?.meetingKey === nextRace.meetingKey,
          )
        : -1;

    return (
        <div className="border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 rounded-xl p-6 relative shadow-2xl">
            <h2 className="text-xs font-black text-zinc-400 tracking-wider mb-6 uppercase">
                2026 Season Timeline
            </h2>

            <div className="space-y-4 relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-zinc-800" />

                {processedWeekends.map((weekend, index) => {
                    if (!weekend) return null;

                    const isLive = now
                        ? now >= weekend.startTime && now <= weekend.endTime
                        : false;
                    const isPast = now ? now > weekend.endTime : false;
                    const isFuture = now ? now < weekend.startTime : true;

                    const isTargetCard = index === currentIndex;
                    const isOpen = openId === weekend.meetingKey;

                    return (
                        <div
                            key={weekend.meetingKey}
                            ref={isTargetCard ? activeCardRef : null}
                            className="relative pl-9 group"
                        >
                            {/* CONNECTOR PIN */}
                            <div
                                className={`absolute left-1.5 top-5 w-4 h-4 rounded-full border-4 border-zinc-950 flex items-center justify-center transition-all duration-300 z-10
                                ${
                                    isLive
                                        ? "bg-red-500 scale-125 shadow-lg shadow-red-500/50"
                                        : isPast
                                          ? "bg-emerald-500"
                                          : "bg-zinc-800 group-hover:bg-zinc-600"
                                }`}
                            />

                            {/* TIMELINE CARD */}
                            <div
                                className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer backdrop-blur-sm
                                    ${
                                        isLive
                                            ? "border-red-500/60 bg-red-500/3 shadow-xl shadow-red-500/2"
                                            : isTargetCard
                                              ? "border-zinc-700 bg-zinc-900/40 shadow-md"
                                              : "border-zinc-800/80 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/20"
                                    }`}
                                onClick={() =>
                                    setOpenId(
                                        isOpen ? null : weekend.meetingKey,
                                    )
                                }
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3
                                            className={`font-bold tracking-tight text-sm transition-colors ${isPast ? "text-zinc-500 line-through" : "text-zinc-100"}`}
                                        >
                                            {weekend.country}
                                        </h3>
                                        <p className="text-xs text-zinc-500 font-medium mt-0.5">
                                            {weekend.circuit}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-mono font-bold text-zinc-400">
                                            {new Date(
                                                weekend.firstSession.dateStart,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </p>

                                        {now && (
                                            <>
                                                {isPast && (
                                                    <span className="text-[10px] font-bold text-emerald-500 mt-1 block uppercase tracking-wider">
                                                        Done
                                                    </span>
                                                )}
                                                {isLive && (
                                                    <span className="text-[10px] font-bold text-red-400 mt-1 block uppercase tracking-widest animate-pulse">
                                                        ● Live
                                                    </span>
                                                )}
                                                {isFuture && isTargetCard && (
                                                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded mt-1 inline-block uppercase tracking-wider">
                                                        Next Up
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="mt-4 border-t border-zinc-800/60 pt-3 space-y-2 animate-fadeIn">
                                        {weekend.sortedSessions.map((s) => (
                                            <div
                                                key={s.sessionName}
                                                className="flex justify-between items-center text-xs"
                                            >
                                                <span className="text-zinc-400 font-medium">
                                                    {s.sessionName}
                                                </span>
                                                <span className="text-zinc-500 font-mono">
                                                    {new Date(
                                                        s.dateStart,
                                                    ).toLocaleString("en-GB", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: false,
                                                    })}
                                                </span>
                                            </div>
                                        ))}
                                        {/* Only render results button for completed race weekends */}
                                        {isPast && (
                                            <a
                                                href={`/races/${weekend.meetingKey}`}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className="block mt-4 w-full text-center text-xs font-bold py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded transition-colors"
                                            >
                                                View Race Results
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
