"use client";

import AppLayout from "@/components/layout/AppLayout";
import DriverTable from "@/components/DriverTable";
import TeamTable from "@/components/TeamTable";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import { useStandings } from "@/hooks/useStandings";
import { useTeamStandings } from "@/hooks/useTeamStandings";
import { useMemo, useState } from "react";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";

export default function Home() {
    const { data: standings = [], loading: driverLoading } = useStandings();
    const { data: teams = [], loading: teamLoading } = useTeamStandings();
    const { data: races = [] } = useRaceWeekends();

    const [activeTab, setActiveTab] = useState<"drivers" | "constructors">(
        "drivers",
    );

    const sortedStandings = useMemo(
        () => [...standings].sort((a, b) => b.points - a.points),
        [standings],
    );

    const sortedTeams = useMemo(
        () => [...teams].sort((a, b) => b.points - a.points),
        [teams],
    );

    const leader = sortedStandings[0];
    const runnerUp = sortedStandings[1];
    const topTeam = sortedTeams[0];

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 text-zinc-100">
                {/* 1. HERO HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-linear-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                            Race Hub Dashboard
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            Live telemetry, individual driver insights, and
                            constructor standing data.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 self-start md:self-auto">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-zinc-400 uppercase tracking-wider">
                            System Connected
                        </span>
                    </div>
                </div>

                {/* 2. THE BIG STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Driver Leader */}
                    <div className="relative group overflow-hidden bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Championship Leader
                        </p>
                        <div className="mt-4 flex items-baseline justify-between">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                                {driverLoading
                                    ? "Loading..."
                                    : (leader?.driverName ?? "N/A")}
                            </h2>
                            <span className="text-xs font-mono px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 font-bold">
                                {leader?.points ?? 0} PTS
                            </span>
                        </div>
                        <p
                            className="text-xs text-zinc-500 mt-1 font-medium"
                            style={{
                                color: leader?.teamColor
                                    ? `#${leader.teamColor}`
                                    : undefined,
                            }}
                        >
                            {leader?.teamName ?? "—"}
                        </p>
                    </div>

                    {/* Card 2: Constructor Leader */}
                    <div className="relative group overflow-hidden bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Constructor Leader
                        </p>
                        <div className="mt-4 flex items-baseline justify-between">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                                {teamLoading
                                    ? "Loading..."
                                    : (topTeam?.teamName ?? "N/A")}
                            </h2>
                            <span className="text-xs font-mono px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 font-bold">
                                {topTeam?.points ?? 0} PTS
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Leading the pack
                        </p>
                    </div>

                    {/* Card 3: Standings Deficit */}
                    <div className="relative group overflow-hidden bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300">
                        <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Title Fight Gap
                        </p>
                        <div className="mt-4 flex items-baseline justify-between">
                            <h2 className="text-3xl font-black tracking-mono text-red-500">
                                {sortedStandings.length > 1
                                    ? `+${leader.points - runnerUp.points}`
                                    : "0"}{" "}
                                <span className="text-sm font-normal text-zinc-400">
                                    PTS
                                </span>
                            </h2>
                            <span className="text-xs text-zinc-400 font-medium">
                                P1 vs P2
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 truncate">
                            {runnerUp
                                ? `Chased close by ${runnerUp.driverName}`
                                : "No clear challenger"}
                        </p>
                    </div>
                </div>

                {/* 3. DUAL-COLUMN LAYOUT FOR CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left/Middle Column: Interactive Standings Hub */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
                            {/* Segmented Tab Controls */}
                            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 max-w-xs mb-6">
                                <button
                                    onClick={() => setActiveTab("drivers")}
                                    className={`flex-1 py-2 text-center text-xs font-bold tracking-wide uppercase rounded-lg transition-all ${
                                        activeTab === "drivers"
                                            ? "bg-zinc-800 text-white shadow-md border-b border-zinc-700"
                                            : "text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    Drivers
                                </button>
                                <button
                                    onClick={() => setActiveTab("constructors")}
                                    className={`flex-1 py-2 text-center text-xs font-bold tracking-wide uppercase rounded-lg transition-all ${
                                        activeTab === "constructors"
                                            ? "bg-zinc-800 text-white shadow-md border-b border-zinc-700"
                                            : "text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    Teams
                                </button>
                            </div>

                            {/* Render Target with soft fade */}
                            <div className="animated fadeIn duration-200">
                                {activeTab === "drivers" ? (
                                    <DriverTable />
                                ) : (
                                    <TeamTable />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Sticky Panel: Upcoming Event Profile */}
                    <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                Next Race Event
                            </h3>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        </div>
                        <div className="shadow-2xl">
                            <RaceWeekendCard variant="card" data={races} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
