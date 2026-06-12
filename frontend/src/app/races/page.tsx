"use client";

import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import SeasonTimeline from "@/components/dashboard/SeasonTimeline";
import { getNextRaceWeekend } from "@/utils/race"; // Import utility

export default function RacesPage() {
    const { data, loading, error } = useRaceWeekends();

    // Memoize the next race to prevent unnecessary recalculations
    const nextRace = useMemo(() => getNextRaceWeekend(data || []), [data]);

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

    return (
        <AppLayout>
            {/* Pass the single object, not the array */}
            <RaceWeekendCard variant="sticky" data={nextRace} />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-6">Race Calendar</h1>

                <div className="mt-8">
                    <SeasonTimeline weekends={data} />
                </div>
            </div>
        </AppLayout>
    );
}
