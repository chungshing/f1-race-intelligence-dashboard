"use client";

import AppLayout from "@/components/AppLayout";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";

export default function RacesPage() {
    const { loading } = useRaceWeekends();

    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6">
                Race Calendar
            </h1>

            {/* NEXT RACE */}
            <RaceWeekendCard />

            {/* You can later add full calendar component */}
        </AppLayout>
    );
}