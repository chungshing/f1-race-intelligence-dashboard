"use client";

import { useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import DriverTable from "@/components/DriverTable";
import TeamTable from "@/components/TeamTable";
import { useStandings } from "@/hooks/useStandings";
import { useTeamStandings } from "@/hooks/useTeamStandings";

export default function Home() {
    const { data: standings = [], loading: driverLoading } = useStandings();
    const { data: teams = [], loading: teamLoading } = useTeamStandings();

    const sortedStandings = useMemo(() => {
        return [...standings].sort((a, b) => b.points - a.points);
    }, [standings]);

    const sortedTeams = useMemo(() => {
        return [...teams].sort((a, b) => b.points - a.points);
    }, [teams]);

    const leader = sortedStandings[0];
    const topTeam = sortedTeams[0];

    return (
        <main className="min-h-screen bg-black text-white flex">
            <Sidebar />

            <div className="flex-1">
                <Topbar />

                <div className="p-8 space-y-8">
                    {/* STATS */}
                    <StatCard
                        title="Championship Leader"
                        value={
                            driverLoading
                                ? "Loading..."
                                : (leader?.driverName ?? "N/A")
                        }
                    />

                    <StatCard
                        title="Constructor Leader"
                        value={
                            teamLoading
                                ? "Loading..."
                                : (topTeam?.teamName ?? "-")
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

                    {/* TABLES */}
                    <DriverTable />
                    <TeamTable />
                </div>
            </div>
        </main>
    );
}
