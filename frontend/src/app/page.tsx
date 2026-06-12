"use client";

import AppLayout from "@/components/layout/AppLayout";
import { DriverTable } from "@/components/DriverTable";
import { TeamTable } from "@/components/TeamTable";
import RaceWeekendCard from "@/components/RaceWeekendCard";
import { useStandings, useTeamStandings } from "@/hooks/useStandings";
import { useMemo, useState, useEffect } from "react";
import { useRaceWeekends } from "@/hooks/useRaceWeekends";
import { getNextRaceWeekend } from "@/utils/race";
import { RaceResultsTable } from "@/components/RaceResultsTable";
import { useDriverLookup } from "@/hooks/useDriverLookup";
import { getRaceResults } from "@/lib/app";
import { DriverResult } from "@/types/results";

type TabType = "drivers" | "constructors";

interface SupabaseRaceRow {
    session_key: number;
    meeting_key: number;
    country: string;
    session_name: string;
    classification_json: string | DriverResult[];
}

export default function Home() {
    // 1. Existing Hooks & State
    const { data: standings = [], loading: driverLoading } = useStandings();
    const { data: teams = [], loading: teamLoading } = useTeamStandings();
    const { data: races = [] } = useRaceWeekends();
    const [activeTab, setActiveTab] = useState<TabType>("drivers");

    // 2. Real Live Results State matching your details page style
    const driverLookup = useDriverLookup();
    const [latestClassification, setLatestClassification] = useState<
        DriverResult[]
    >([]);
    const [resultsLoading, setResultsLoading] = useState(true);

    // 3. Derived Next Race details
    const nextRace = useMemo(() => getNextRaceWeekend(races), [races]);

    // 4. Automatically query and filter for the latest completed full race
    useEffect(() => {
        let isMounted = true;
        if (!races || races.length === 0) return;

        // Sort descending to target the most recent meeting keys
        const sortedRaces = [...races].sort(
            (a, b) => b.meetingKey - a.meetingKey,
        );

        // Find the first race that yields real database rows
        const fetchLatestRace = async () => {
            for (const race of sortedRaces) {
                try {
                    const data: SupabaseRaceRow[] = await getRaceResults(
                        race.meetingKey,
                    );
                    if (!isMounted) return;

                    // Filter out sessions to target the main event 'Race'
                    const mainRaceSession = data.find(
                        (s) => s.session_name === "Race",
                    );

                    if (mainRaceSession) {
                        let classification =
                            mainRaceSession.classification_json;

                        if (typeof classification === "string") {
                            try {
                                classification = JSON.parse(classification);
                            } catch {
                                classification = [];
                            }
                        }

                        if (
                            Array.isArray(classification) &&
                            classification.length > 0
                        ) {
                            setLatestClassification(classification);
                            setResultsLoading(false);
                            return; // Found it! Exit early
                        }
                    }
                } catch (err) {
                    console.error(
                        `Failed to check latest race results for meeting ${race.meetingKey}:`,
                        err,
                    );
                }
            }
            if (isMounted) setResultsLoading(false);
        };

        fetchLatestRace();

        return () => {
            isMounted = false;
        };
    }, [races]);

    // Standing calculations
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
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6 text-zinc-100">
                {/* HERO HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 md:pb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Race Hub Dashboard
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            Live season telemetry and analytics.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 self-start md:self-auto">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-zinc-300 uppercase tracking-wider font-bold">
                            System Connected
                        </span>
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            label: "Championship Leader",
                            val: driverLoading ? "..." : leader?.driverName,
                            sub: leader?.teamName,
                            pts: leader?.points,
                            color: leader?.teamColor,
                        },
                        {
                            label: "Constructor Leader",
                            val: teamLoading ? "..." : topTeam?.teamName,
                            sub: "Factory Lead",
                            pts: topTeam?.points,
                        },
                        {
                            label: "Title Fight Gap",
                            val:
                                leader && runnerUp
                                    ? `+${leader.points - runnerUp.points}`
                                    : "—",
                            sub: "Points Delta",
                            pts: null,
                        },
                    ].map((card, i) => (
                        <div
                            key={i}
                            className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                {card.label}
                            </p>
                            <h2 className="text-xl font-black mt-2 truncate">
                                {card.val ?? "No Data"}
                            </h2>
                            <p
                                className="text-[10px] mt-1 truncate"
                                style={{
                                    color: card.color
                                        ? `#${card.color}`
                                        : "#71717a",
                                }}
                            >
                                {card.sub}
                            </p>
                            {card.pts !== null && (
                                <span className="absolute top-5 right-5 text-[10px] font-mono font-bold bg-zinc-800 px-2 py-0.5 rounded">
                                    {card.pts} PTS
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* DUAL-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
                        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full max-w-70 mb-6">
                            {(["drivers", "constructors"] as const).map(
                                (tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-2.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                            activeTab === tab
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ),
                            )}
                        </div>

                        <div className="w-full overflow-x-auto">
                            {activeTab === "drivers" ? (
                                <DriverTable
                                    standings={sortedStandings}
                                    limit={7}
                                />
                            ) : (
                                <TeamTable standings={sortedTeams} limit={7} />
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-6">
                        {/* NEXT RACE */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-2">
                                Next Race
                            </h3>
                            {nextRace ? (
                                <RaceWeekendCard
                                    variant="card"
                                    data={nextRace}
                                />
                            ) : (
                                <div className="h-40 bg-zinc-900/50 rounded-2xl animate-pulse" />
                            )}
                        </div>

                        {/* LATEST RACE RESULTS */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-2">
                                Latest Race Results
                            </h3>
                            {resultsLoading ? (
                                <div className="h-44 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl animate-pulse" />
                            ) : latestClassification.length > 0 ? (
                                <RaceResultsTable
                                    classification={latestClassification}
                                    lookup={driverLookup}
                                    variant="landing"
                                />
                            ) : (
                                <div className="text-xs text-zinc-500 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 text-center">
                                    No completed race data available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
