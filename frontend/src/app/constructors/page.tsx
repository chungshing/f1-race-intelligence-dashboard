"use client";

import { useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { TeamTable } from "@/components/TeamTable";
import { useTeamStandings } from "@/hooks/useStandings";

export default function ConstructorsPage() {
    const { data: teams = [], loading } = useTeamStandings();

    const sortedTeams = useMemo(
        () => [...teams].sort((a, b) => b.points - a.points),
        [teams],
    );

    return (
        <AppLayout>
            <h1 className="text-2xl font-bold mb-6 text-zinc-100">
                Constructors
            </h1>
            {loading ? (
                <p className="text-sm text-zinc-400 font-mono animate-pulse">
                    Loading constructors...
                </p>
            ) : (
                <TeamTable standings={sortedTeams} />
            )}
        </AppLayout>
    );
}
