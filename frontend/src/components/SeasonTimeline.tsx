"use client";

import { useState } from "react";
import { RaceWeekend } from "@/types/race";
import { getNextRaceWeekend } from "@/utils/race";

type Props = {
    weekends: RaceWeekend[];
};

export default function SeasonTimeline({ weekends }: Props) {
    const nextRace = getNextRaceWeekend(weekends);

    const [openId, setOpenId] = useState<number | null>(null);

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
                    const firstSession = [...weekend.sessions].sort(
                        (a, b) =>
                            new Date(a.dateStart).getTime() -
                            new Date(b.dateStart).getTime(),
                    )[0];

                    const raceDate = new Date(firstSession.dateStart);

                    const isPast = currentIndex !== -1 && index < currentIndex;

                    const isCurrent = index === currentIndex;
                    const isFuture = index > currentIndex;

                    const isOpen = openId === weekend.meetingKey;

                    return (
                        <div
                            key={weekend.meetingKey}
                            className="relative pl-10"
                        >
                            {/* DOT */}
                            <div
                                className={`absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${
                                    isCurrent
                                        ? "bg-red-500 text-white"
                                        : isPast
                                          ? "bg-green-500 text-white"
                                          : "bg-gray-700 text-gray-300"
                                }`}
                            >
                                {isPast ? "✓" : isCurrent ? "🏁" : ""}
                            </div>

                            {/* CARD */}
                            <div
                                className={`rounded-lg border p-4 transition cursor-pointer
                                ${
                                    isCurrent
                                        ? "border-red-500 bg-red-500/10"
                                        : "border-gray-800 hover:border-gray-600"
                                }
                            `}
                                onClick={() =>
                                    setOpenId(
                                        isOpen ? null : weekend.meetingKey,
                                    )
                                }
                            >
                                {/* HEADER BLOCK (your requested update starts here) */}
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
                                            {raceDate.toLocaleDateString(
                                                "en-GB",
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                },
                                            )}
                                        </p>

                                        {isPast && (
                                            <p className="text-xs text-green-400">
                                                Completed
                                            </p>
                                        )}

                                        {isCurrent && (
                                            <p className="text-xs text-red-400 font-semibold">
                                                Current Weekend
                                            </p>
                                        )}

                                        {isFuture && (
                                            <p className="text-xs text-gray-500">
                                                Upcoming
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
