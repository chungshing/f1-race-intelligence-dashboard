"use client";

import AppLayout from "@/components/AppLayout";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import { getNextRaceWeekend } from "@/utils/race";

export default function RacesPage() {
    const { data, loading, error } = useRaceWeekends();

    const nextRace = !loading && !error ? getNextRaceWeekend(data) : null;

    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6">Race Calendar</h1>

            {/* 🟢 NEXT RACE (HIGHLIGHTED) */}
            {nextRace && (
                <div className="bg-gray-900 border border-red-500 p-6 rounded-xl mb-6">
                    <p className="text-sm text-gray-400">Next Race Weekend</p>

                    <h2 className="text-xl font-bold mt-1">
                        {nextRace.country}
                    </h2>

                    <p className="text-gray-400">{nextRace.circuit}</p>

                    <div className="mt-3 space-y-1 text-sm text-gray-300">
                        {nextRace.sessions.map((s) => {
                            const date = new Date(s.dateStart);

                            return (
                                <div
                                    key={`${s.sessionName}-${s.dateStart}`}
                                    className="flex justify-between"
                                >
                                    <span>{s.sessionName}</span>

                                    <span className="text-gray-500">
                                        {date.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                        })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 🟡 FULL CALENDAR */}
            <div className="grid gap-4">
                {data.map((weekend) => (
                    <div
                        key={weekend.meetingKey}
                        className="bg-gray-900 p-4 rounded-xl"
                    >
                        <h2 className="font-bold">{weekend.country}</h2>

                        <p className="text-gray-400">{weekend.circuit}</p>

                        <div className="mt-2 space-y-1 text-sm text-gray-300">
                            {weekend.sessions.map((s) => {
                                const date = new Date(s.dateStart);

                                return (
                                    <div
                                        key={`${s.sessionName}-${s.dateStart}`}
                                        className="flex justify-between"
                                    >
                                        <span>{s.sessionName}</span>

                                        <span className="text-gray-500">
                                            {date.toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
