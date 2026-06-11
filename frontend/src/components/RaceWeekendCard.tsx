"use client";

import { useEffect, useState } from "react";
import {
    getNextSession,
    getTimeRemaining,
    getWeekendLabel,
} from "@/utils/race";
import { RaceWeekend } from "@/types/race";

type Props = {
    variant?: "card" | "sticky";
    data: RaceWeekend | null; // FIX: Changed from RaceWeekend[] to single object or null
};

export default function RaceWeekendCard({ variant = "card", data }: Props) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    // FIX: Simplified fallback check for null/undefined data
    if (!data) {
        return (
            <div className="text-sm text-zinc-400 p-4 border border-zinc-800 rounded-xl bg-zinc-950">
                No upcoming races found
            </div>
        );
    }

    // Always guarantee chronological order for display rendering
    const sortedSessions = [...data.sessions].sort(
        (a, b) =>
            new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    );

    const nextSession = getNextSession(sortedSessions);
    const timeLeft = nextSession
        ? getTimeRemaining(new Date(nextSession.dateStart))
        : null;

    /* =======================
        STICKY COMPACT MODE
    ======================= */
    if (variant === "sticky") {
        return (
            <div className="sticky top-16 left-0 right-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex justify-between items-center shadow-lg">
                <div>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        Next Grand Prix
                    </span>
                    <p className="text-zinc-100 font-bold text-sm tracking-tight">
                        {data.country}
                    </p>
                    <p className="text-zinc-500 text-xs font-medium">
                        {data.circuit}
                    </p>
                </div>

                {nextSession && (
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Next Up: {nextSession.sessionName}
                        </span>
                        {timeLeft && (
                            <p className="text-red-400 font-mono font-bold text-sm">
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
        FULL WIDGET CARD MODE
    ======================= */
    return (
        <div className="border border-zinc-800 rounded-xl p-5 bg-linear-to-b from-zinc-900 to-zinc-950 shadow-2xl space-y-5">
            <div className="border-b border-zinc-800/60 pb-3">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                    Next Grand Prix
                </span>
                <h2 className="text-xl font-black text-zinc-100 tracking-tight mt-0.5">
                    {data.country}
                </h2>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-zinc-400 text-xs font-medium">
                        {data.circuit}
                    </p>
                    <p className="text-zinc-500 font-mono text-xs font-semibold">
                        {getWeekendLabel(sortedSessions)}
                    </p>
                </div>
            </div>

            {nextSession && timeLeft && (
                <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl shadow-inner">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Next up
                        </p>
                        <p className="text-zinc-100 font-bold tracking-tight text-sm">
                            {nextSession.sessionName}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Starts In
                        </p>
                        <p className="text-red-400 font-mono font-black text-base">
                            {timeLeft.days}d {timeLeft.hours}h{" "}
                            {timeLeft.minutes}m
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-2.5 pt-1">
                {sortedSessions.map((s) => {
                    const sessionTime = new Date(s.dateStart).getTime();
                    const isDone = sessionTime < now;
                    const isNext =
                        nextSession && s.dateStart === nextSession.dateStart;

                    return (
                        <div
                            key={s.sessionName}
                            className="flex justify-between items-center text-sm group"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
                                    ${
                                        isDone
                                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30"
                                            : isNext
                                              ? "bg-red-950 text-red-400 border border-red-800/50 animate-pulse"
                                              : "bg-zinc-800/50 text-zinc-500"
                                    }`}
                                >
                                    {isDone ? "✓" : isNext ? "▶" : "•"}
                                </span>

                                <span
                                    className={`font-medium tracking-tight transition-colors
                                    ${isNext ? "text-zinc-100 font-bold" : isDone ? "text-zinc-500 line-through decoration-zinc-800" : "text-zinc-400"}`}
                                >
                                    {s.sessionName}
                                </span>
                            </div>

                            <span className="text-zinc-500 font-mono text-xs font-medium group-hover:text-zinc-400 transition-colors">
                                {new Date(s.dateStart).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                })}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
