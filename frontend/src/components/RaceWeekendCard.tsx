"use client";

import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import {
    calculateDaysLeft,
    getNextRaceWeekend,
    getRaceDate,
    getWeekendRange,
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

    return (
        <div className="bg-gray-900 border border-red-500 p-4 rounded-xl">
            {/* Header */}
            <p className="text-gray-400 text-sm">Next Race Weekend</p>

            <h2 className="text-xl font-bold text-white mt-1">
                {next.country}
            </h2>

            <p className="text-gray-300">{next.circuit}</p>

            {/* Race Date */}
            {raceDate && !isNaN(raceDate.getTime()) && (
                <p className="text-sm text-gray-400 mt-2">
                    🏁 Race:{" "}
                    {raceDate.toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </p>
            )}

            {/* Weekend Range */}
            {start &&
                end &&
                !isNaN(start.getTime()) &&
                !isNaN(end.getTime()) && (
                    <p className="text-sm text-gray-400 mt-1">
                        📅{" "}
                        {start.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                        })}{" "}
                        -{" "}
                        {end.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                        })}
                    </p>
                )}

            {/* Countdown */}
            {daysLeft !== null && daysLeft > 0 && (
                <p className="text-red-400 font-semibold mt-2">
                    {daysLeft} days remaining
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
                                {startDate.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                })}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    
}
