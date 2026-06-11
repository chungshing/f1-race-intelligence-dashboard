"use client";

import { useState, useEffect, useRef } from "react";
import { RaceWeekend } from "@/types/race";
import { getNextRaceWeekend } from "@/utils/race";

type Props = {
    weekends: RaceWeekend[];
};

export default function SeasonTimeline({ weekends }: Props) {
    const nextRace = getNextRaceWeekend(weekends);
    const [openId, setOpenId] = useState<number | null>(null);

    // FIX: Lazy initialize to remove impure render calls
    const [now] = useState(() => Date.now());

    const activeCardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Only run scroll anchoring on initial client mount sequence
        const timer = setTimeout(() => {
            if (activeCardRef.current) {
                activeCardRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    const currentIndex = nextRace
        ? weekends.findIndex((w) => w.meeting_key === nextRace.meeting_key)
        : -1;

    return (
        // FIX: Changed bg-gradient-to-b to bg-linear-to-b
        <div className="border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 rounded-xl p-6 relative shadow-2xl">
            {/* FIX: Resolved conflicting font-size, colors, and tracking utilities */}
            <h2 className="text-xs font-black text-zinc-400 tracking-wider mb-6 uppercase">
                2026 Season Timeline
            </h2>

            <div className="space-y-4 relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-zinc-800" />

                {weekends.map((weekend, index) => {
                    // 1. SAFE ACCESS: Default to empty array if sessions is missing
                    const sessions = weekend.sessions ?? [];

                    // 2. GUARD CLAUSE: Skip rendering this card if no session data exists
                    if (sessions.length === 0) return null;

                    const sortedSessions = [...sessions].sort(
                        (a, b) =>
                            new Date(a.dateStart).getTime() -
                            new Date(b.dateStart).getTime(),
                    );

                    const firstSession = sortedSessions[0];
                    const lastSession =
                        sortedSessions[sortedSessions.length - 1];

                    const startTime = new Date(
                        firstSession.dateStart,
                    ).getTime();
                    const endTime =
                        new Date(lastSession.dateEnd).getTime() + 10800000;

                    const isLive = now >= startTime && now <= endTime;
                    const isPast = now > endTime;
                    const isFuture = now < startTime;

                    const isTargetCard = index === currentIndex;
                    const isOpen = openId === weekend.meeting_key;

                    return (
                        <div
                            key={weekend.meeting_key}
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
                                // FIX: Updated opacity shorthands to canonical v4 syntax /3 and /2
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
                                        isOpen ? null : weekend.meeting_key,
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
                                                firstSession.dateStart,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </p>

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
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="mt-4 border-t border-zinc-800/60 pt-3 space-y-2 animate-fadeIn">
                                        {sortedSessions.map((s) => (
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
