"use client";

import AppLayout from "@/components/AppLayout";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import SeasonTimeline from "@/components/SeasonTimeline";
import NextRaceStickyBar from "@/components/NextRaceStickyBar";
import { getNextRaceWeekend, getNextSession } from "@/utils/race";

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

    // ✅ FIX: define next race properly
    const next = getNextRaceWeekend(data);

    // optional chaining safety
    const nextSession = next ? getNextSession(next.sessions) : null;

    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6">Race Calendar</h1>

            {/* STICKY BAR */}
            <NextRaceStickyBar session={nextSession} />

            {/* HERO */}
            <RaceWeekendCard />

            {/* TIMELINE */}
            <div className="mt-8">
                <SeasonTimeline weekends={data} />
            </div>
        </AppLayout>
    );
}
