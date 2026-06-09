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
    const [now, setNow] = useState<number | null>(null);

    const activeCardRef = useRef<HTMLDivElement | null>(null);

    // Defer state update asynchronously to avoid cascading synchronous renders
    useEffect(() => {
        const timer = setTimeout(() => {
            setNow(Date.now());
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (activeCardRef.current) {
            activeCardRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [now]);

    const currentIndex = nextRace
        ? weekends.findIndex((w) => w.meetingKey === nextRace.meetingKey)
        : -1;

    return (
        <div className="bg-gray-900 rounded-xl p-6 relative">
            {/* HEADER */}
            <h2 className="text-lg font-bold mb-6">2026 Season Timeline</h2>

            {/* TIMELINE */}
            <div className="space-y-4 relative">
                {/* vertical line */}
                <div className="absolute left-3 top-2 bottom-0 w-px bg-gray-700" />

                {weekends.map((weekend, index) => {
                    const sortedSessions = [...weekend.sessions].sort(
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
                        new Date(lastSession.dateStart).getTime() + 10800000; // 3-hour buffer

                    const isLive = now
                        ? now >= startTime && now <= endTime
                        : false;
                    const isPast = now
                        ? now > endTime
                        : currentIndex !== -1 && index < currentIndex;
                    const isFuture = now
                        ? now < startTime
                        : currentIndex !== -1 && index >= currentIndex;

                    const isTargetCard = index === currentIndex;
                    const isOpen = openId === weekend.meetingKey;

                    return (
                        <div
                            key={weekend.meetingKey}
                            ref={isLive || isTargetCard ? activeCardRef : null}
                            className="relative pl-10"
                        >
                            {/* DOT */}
                            <div
                                className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${
                                    isLive
                                        ? "bg-red-500 text-white"
                                        : isPast
                                          ? "bg-green-500 text-white"
                                          : "bg-gray-700 text-gray-300"
                                }`}
                            >
                                {isPast ? "✓" : isLive ? "🏁" : ""}
                            </div>

                            {/* CARD */}
                            <div
                                className={`rounded-lg border p-4 transition cursor-pointer
                                ${
                                    isLive
                                        ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20"
                                        : isTargetCard
                                          ? "border-blue-500 bg-blue-500/5 shadow-md"
                                          : "border-gray-800 hover:border-gray-600"
                                }
                            `}
                                onClick={() =>
                                    setOpenId(
                                        isOpen ? null : weekend.meetingKey,
                                    )
                                }
                            >
                                {/* HEADER BLOCK */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3
                                            className={`font-semibold ${
                                                isPast
                                                    ? "text-gray-500"
                                                    : "text-white"
                                            }`}
                                        >
                                            {weekend.country}
                                        </h3>

                                        <p className="text-sm text-gray-400">
                                            {weekend.circuit}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-300">
                                            {new Date(
                                                firstSession.dateStart,
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </p>

                                        {isPast && (
                                            <p className="text-xs text-green-400">
                                                Completed
                                            </p>
                                        )}

                                        {isLive && (
                                            <span className="text-xs text-red-400 font-bold animate-pulse">
                                                LIVE WEEKEND
                                            </span>
                                        )}

                                        {isFuture && (
                                            <p className="text-xs text-gray-500">
                                                {isTargetCard
                                                    ? "Next Race"
                                                    : "Upcoming"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* EXPANDABLE CONTENT */}
                                {isOpen && (
                                    <div className="mt-4 border-t border-gray-800 pt-3 space-y-2">
                                        {weekend.sessions.map((s) => (
                                            <div
                                                key={s.sessionName}
                                                className="flex justify-between text-sm"
                                            >
                                                <span className="text-gray-300">
                                                    {s.sessionName}
                                                </span>

                                                <span className="text-gray-500">
                                                    {new Date(
                                                        s.dateStart,
                                                    ).toLocaleString("en-GB", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
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
