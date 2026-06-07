"use client";

import {
    getNextRaceWeekend,
    getNextSession,
    getTimeRemaining,
    getWeekendLabel,
    getSessionStatus,
    isWeekendActive,
} from "@/utils/race";

import { RaceWeekend } from "@/types/race";

type Props = {
    variant?: "card" | "sticky";
    data: RaceWeekend[];
};

export default function RaceWeekendCard({ variant = "card", data }: Props) {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="bg-red-900 p-4 rounded-xl">
                Failed to load race weekends
            </div>
        );
    }

    const nextWeekend  =
        data.find((w) => isWeekendActive(w)) ?? getNextRaceWeekend(data);

    if (!nextWeekend) {
        return (
            <div className="bg-gray-900 p-4 rounded-xl">
                No upcoming races found
            </div>
        );
    }

    const sessions = nextWeekend .sessions;
    const nextSession = getNextSession(sessions);

    const timeLeft = nextSession
        ? getTimeRemaining(new Date(nextSession.dateStart))
        : null;

    /* =======================
        STICKY MODE
    ======================= */
    if (variant === "sticky") {
        return (
            <div className="sticky top-0 left-0 right-0 z-50 w-full bg-black/60 backdrop-blur border-b border-red-500 px-4 py-2 flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-400 uppercase">Next Race</p>
                    <p className="text-white font-semibold">
                        {nextWeekend.country}
                    </p>
                    <p className="text-gray-400 text-xs">
                        {nextWeekend.circuit}
                    </p>
                </div>

                {nextSession && (
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Next Session</p>
                        <p className="text-red-400 font-bold">
                            {nextSession.sessionName}
                        </p>

                        {timeLeft && (
                            <p className="text-xs text-gray-500">
                                {timeLeft.days}d {timeLeft.hours}h{" "}
                                {timeLeft.minutes}m
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    /* =======================
        FULL CARD MODE
    ======================= */
    return (
        <div className="bg-gray-900 border border-red-500 p-5 rounded-xl space-y-4">
            <div>
                <p className="text-gray-400 text-sm">Next Grand Prix</p>

                <h2 className="text-xl font-bold text-white">
                    {nextWeekend.country}
                </h2>

                <p className="text-gray-400 text-sm">{nextWeekend.circuit}</p>

                <p className="text-gray-500 text-xs mt-1">
                    {getWeekendLabel(sessions)}
                </p>
            </div>

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

            <div className="space-y-2">
                {sessions.map((s) => {
                    const status = getSessionStatus(
                        sessions,
                        s.sessionName,
                        nextSession?.sessionName,
                    );

                    return (
                        <div
                            key={s.sessionName}
                            className="flex justify-between text-sm"
                        >
                            <div className="flex items-center gap-2">
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

                            <span className="text-gray-500 text-xs">
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
