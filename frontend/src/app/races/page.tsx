"use client";

import AppLayout from "@/components/AppLayout";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import { getNextRaceWeekend, groupSessionsByDay } from "@/utils/race";

export default function RacesPage() {
    const { data, loading, error } = useRaceWeekends();

    if (loading) {
        return (
            <AppLayout>
                <p>Loading race calendar...</p>
            </AppLayout>
        );
    }

    if (error || !data?.length) {
        return (
            <AppLayout>
                <p>Failed to load races</p>
            </AppLayout>
        );
    }

    const next = getNextRaceWeekend(data);

    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6">Race Calendar</h1>

            {/* 🟢 NEXT RACE HERO */}
            <RaceWeekendCard />

            {/* 🧭 NEXT RACE TIMELINE */}
            {next && (
                <div className="mt-8 bg-gray-900 p-6 rounded-xl">
                    <h2 className="text-lg font-bold mb-4">Weekend Timeline</h2>

                    {Object.entries(groupSessionsByDay(next.sessions)).map(
                        ([day, sessions]) => (
                            <div key={day} className="mb-4">
                                <p className="text-gray-400 font-semibold mb-2">
                                    {day}
                                </p>

                                <div className="space-y-1">
                                    {sessions.map((s) => (
                                        <div
                                            key={s.sessionName}
                                            className="flex justify-between text-sm text-gray-300"
                                        >
                                            <span>{s.sessionName}</span>
                                            <span className="text-gray-500">
                                                {new Date(
                                                    s.dateStart,
                                                ).toLocaleTimeString("en-GB", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}

            {/* 🟡 FULL CALENDAR */}
            <div className="mt-8 grid gap-4">
                {data.map((weekend) => (
                    <div
                        key={weekend.meetingKey}
                        className="bg-gray-900 p-4 rounded-xl"
                    >
                        <h2 className="font-bold">{weekend.country}</h2>
                        <p className="text-gray-400">{weekend.circuit}</p>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
