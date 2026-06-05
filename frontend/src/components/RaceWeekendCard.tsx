"use client";

import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import {
    calculateDaysLeft,
    getNextRaceWeekend,
    getRaceDate,
    getWeekendRange,
    formatWeekendDisplay,
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

    const next = getNextRaceWeekend(data);

    if (!next || !Array.isArray(next.sessions)) {
        return (
            <div className="bg-gray-900 p-4 rounded-xl">
                No upcoming races found
            </div>
        );
    }

    const sessions = next.sessions;

    const raceDate = getRaceDate(sessions);
    const { start, end } = getWeekendRange(sessions);
    const daysLeft = raceDate ? calculateDaysLeft(raceDate) : null;
    const timeLeft = raceDate ? getTimeRemaining(raceDate) : null;

    return (
        <div className="bg-gray-900 border border-red-500 p-4 rounded-xl">
            {/* Header */}
            <div className="flex justify-between items-start">
                {/* Left: Title */}
                <div>
                    <p className="text-gray-400 text-sm">Next Race Weekend</p>

                    <h2 className="text-xl font-bold text-white mt-1">
                        {next.country}
                    </h2>

                    <p className="text-gray-300">{next.circuit}</p>
                </div>

                {/* Right: Countdown Badge */}
                {timeLeft && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 px-3 py-2 rounded-lg text-right">
                        <p className="text-xs uppercase tracking-wide">
                            Starts in
                        </p>

                        <p className="font-bold">
                            {timeLeft.days}d {timeLeft.hours}h{" "}
                            {timeLeft.minutes}m
                        </p>
                    </div>
                )}
            </div>

            {/* Race Date */}
            {raceDate && !isNaN(raceDate.getTime()) && (
                <p className="text-sm text-gray-400 mt-2">
                    🏁 Race:{" "}
                    {raceDate.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    })}
                </p>
            )}

            {/* Weekend Range */}
            {start &&
                end &&
                !isNaN(start.getTime()) &&
                !isNaN(end.getTime()) && (
                    <p className="text-sm text-gray-400 mt-1">
                        📅 {formatWeekendDisplay(start, end)}
                    </p>
                )}

            {/* Sessions */}
            <div className="mt-4 space-y-2 text-sm">
                {sessions.map((s) => {
                    const startDate = new Date(s.dateStart);

                    if (isNaN(startDate.getTime())) return null;

                    return (
                        <div
                            key={`${s.sessionName}-${s.dateStart}`}
                            className="flex justify-between text-gray-300"
                        >
                            <span>{s.sessionName}</span>

                            <span className="text-gray-500">
                                {startDate.toLocaleString("en-GB", {
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
