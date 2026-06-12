"use client";

import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { DriverTable } from "@/components/DriverTable";
import { useStandings } from "@/hooks/useStandings";

export default function DriversPage() {
    const { data: standings = [], loading } = useStandings();

    const sortedStandings = useMemo(
        () => [...standings].sort((a, b) => b.points - a.points),
        [standings],
    );

    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6 text-zinc-100">Drivers</h1>
            {loading ? (
                <p className="text-sm text-zinc-400 font-mono animate-pulse">
                    Loading standings...
                </p>
            ) : (
                <DriverTable standings={sortedStandings} />
            )}
        </AppLayout>
    );
}
