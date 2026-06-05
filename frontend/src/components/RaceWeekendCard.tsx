"use client";

import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import {
    getNextRaceWeekend,
    getNextSession,
    getTimeRemaining,
} from "@/utils/race";

export default function RaceWeekendCard() {
    const { data, loading, error } = useRaceWeekends();

    if (loading) {
        return (
            <div className="bg-gray-900 p-4 rounded-xl">
                Loading race weekend...
            </div>
        );
    }

    if (error || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="bg-red-900 p-4 rounded-xl">
                Failed to load race weekends
            </div>
        );
    }

    const nextWeekend = getNextRaceWeekend(data);

    if (!nextWeekend) {
        return (
            <div className="bg-gray-900 p-4 rounded-xl">
                No upcoming races found
            </div>
        );
    }

    const sessions = nextWeekend.sessions;

    const nextSession = getNextSession(sessions);

    const timeLeft = nextSession
        ? getTimeRemaining(new Date(nextSession.dateStart))
        : null;

    const getStatus = (sessionName: string) => {
        if (!nextSession) return "upcoming";

        const order = sessions.findIndex((s) => s.sessionName === sessionName);

        const nextIndex = sessions.findIndex(
            (s) => s.sessionName === nextSession.sessionName,
        );

        if (order < nextIndex) return "done";
        if (order === nextIndex) return "next";
        return "upcoming";
    };

    return (
        <div className="bg-gray-900 border border-red-500 p-5 rounded-xl space-y-4">
            {/* HEADER */}
            <div>
                <p className="text-gray-400 text-sm">Next Grand Prix</p>

                <h2 className="text-xl font-bold text-white">
                    {nextWeekend.country}
                </h2>

                <p className="text-gray-400 text-sm">{nextWeekend.circuit}</p>
            </div>

            {/* NEXT SESSION HIGHLIGHT */}
            {nextSession && (
                <div className="flex justify-between items-end bg-red-500/10 border border-red-500 p-3 rounded-lg">
                    <div>
                        <p className="text-xs text-gray-400 uppercase">
                            Next Session
                        </p>
                        <p className="text-white font-semibold">
                            {nextSession.sessionName}
                        </p>
                    </div>

                    {timeLeft && (
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Starts in</p>
                            <p className="text-red-400 font-bold">
                                {timeLeft.days}d {timeLeft.hours}h{" "}
                                {timeLeft.minutes}m
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* TIMELINE */}
            <div className="space-y-2">
                {sessions.map((s) => {
                    const status = getStatus(s.sessionName);

                    return (
                        <div
                            key={s.sessionName}
                            className="flex items-center justify-between text-sm"
                        >
                            {/* LEFT */}
                            <div className="flex items-center gap-2">
                                {/* STATUS ICON */}
                                <span
                                    className={
                                        status === "done"
                                            ? "text-green-400"
                                            : status === "next"
                                              ? "text-red-400"
                                              : "text-gray-600"
                                    }
                                >
                                    {status === "done"
                                        ? "✓"
                                        : status === "next"
                                          ? "▶"
                                          : "•"}
                                </span>

                                {/* SESSION NAME */}
                                <span
                                    className={
                                        status === "next"
                                            ? "text-white font-semibold"
                                            : status === "done"
                                              ? "text-gray-500"
                                              : "text-gray-400"
                                    }
                                >
                                    {s.sessionName}
                                </span>
                            </div>

                            {/* RIGHT: DATE + TIME */}
                            <span className="text-gray-500 text-xs text-right">
                                {new Date(s.dateStart).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
