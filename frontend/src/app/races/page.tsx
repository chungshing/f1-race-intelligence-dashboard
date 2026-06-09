"use client";

import AppLayout from "@/components/AppLayout";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import SeasonTimeline from "@/components/SeasonTimeline";

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

    return (
        <AppLayout>
            <RaceWeekendCard variant="sticky" data={data} />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-6">Race Calendar</h1>

                <div className="mt-8">
                    <SeasonTimeline weekends={data} />
                </div>
            </div>
        </AppLayout>
    );
}
