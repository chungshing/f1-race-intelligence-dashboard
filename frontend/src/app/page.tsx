"use client";

import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import { useStandings } from "@/hooks/useStandings";
import { useTeamStandings } from "@/hooks/useTeamStandings";
import { useMemo } from "react";

export default function Home() {
    const { data: standings = [], loading: driverLoading } = useStandings();
    const { data: teams = [], loading: teamLoading } = useTeamStandings();

    const sortedStandings = useMemo(
        () => [...standings].sort((a, b) => b.points - a.points),
        [standings]
    );

    const sortedTeams = useMemo(
        () => [...teams].sort((a, b) => b.points - a.points),
        [teams]
    );

    const leader = sortedStandings[0];
    const topTeam = sortedTeams[0];

    return (
        <AppLayout>
            <div className="space-y-6">

                {/* TOP STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Championship Leader"
                        value={
                            driverLoading
                                ? "Loading..."
                                : leader?.driverName ?? "N/A"
                        }
                    />

                    <StatCard
                        title="Constructor Leader"
                        value={
                            teamLoading
                                ? "Loading..."
                                : topTeam?.teamName ?? "N/A"
                        }
                    />

                    <StatCard
                        title="Title Fight Gap"
                        value={
                            sortedStandings.length > 1
                                ? `+${sortedStandings[0].points - sortedStandings[1].points} pts`
                                : "-"
                        }
                    />
                </div>

                {/* NEXT RACE */}
                <div className="mt-6">
                    <RaceWeekendCard />
                </div>

            </div>
        </AppLayout>
    );
}