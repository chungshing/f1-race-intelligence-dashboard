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
import { DriverResult, SupabaseRaceResultRow } from "@/types/results";

type TabType = "drivers" | "constructors";

export default function Home() {
    const { data: standings = [], loading: driverLoading } = useStandings();
    const { data: teams = [], loading: teamLoading } = useTeamStandings();
    const { data: races = [] } = useRaceWeekends();
    const [activeTab, setActiveTab] = useState<TabType>("drivers");
    const driverLookup = useDriverLookup();

    const [mountTimestamp] = useState(() => Date.now());

    const [resultsState, setResultsState] = useState<{
        data: DriverResult[];
        loading: boolean;
    }>({ data: [], loading: true });

    const nextRace = useMemo(() => getNextRaceWeekend(races), [races]);

    // Sort descending by actual calendar date to handle arbitrary meetingKey values correctly
    const sortedRaces = useMemo(() => {
        return races
            .map((race) => {
                const raceSession = race.sessions?.find(
                    (s) => s.sessionName === "Race",
                );
                const raceDate = raceSession
                    ? new Date(raceSession.dateStart)
                    : null;
                return { ...race, raceDate };
            })
            .filter(
                (race) =>
                    race.raceDate && race.raceDate.getTime() <= mountTimestamp,
            )
            .toSorted((a, b) => b.raceDate!.getTime() - a.raceDate!.getTime());
    }, [races, mountTimestamp]);

    // Use a primitive identity key to avoid infinite effect triggers from new array references
    const sortedRacesKey = JSON.stringify(sortedRaces.map((r) => r.meetingKey));

    useEffect(() => {
        let isMounted = true;
        if (!sortedRaces.length) return;

        const fetchLatestCompletedRace = async () => {
            try {
                for (const race of sortedRaces) {
                    const data: SupabaseRaceResultRow[] = await getRaceResults(
                        race.meetingKey,
                    );
                    if (!isMounted) return;

                    const mainRaceSession = data.find(
                        (s) => s.session_name === "Race",
                    );
                    if (mainRaceSession) {
                        let rawData = mainRaceSession.classification_json;
                        if (typeof rawData === "string") {
                            rawData = JSON.parse(rawData);
                        }

                        if (Array.isArray(rawData) && rawData.length > 0) {
                            setResultsState({
                                data: rawData as DriverResult[],
                                loading: false,
                            });
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch latest race data:", err);
            } finally {
                if (isMounted)
                    setResultsState((prev) => ({ ...prev, loading: false }));
            }
        };

        fetchLatestCompletedRace();
        return () => {
            isMounted = false;
        };
    }, [sortedRacesKey, sortedRaces.length, sortedRaces]);

    const leader = standings[0];
    const runnerUp = standings[1];
    const topTeam = teams[0];

    const statsCards = [
        {
            label: "Championship Leader",
            val: driverLoading ? "..." : leader?.driverName,
            sub: leader?.teamName,
            pts: leader?.points,
            color: leader?.teamColor ? `#${leader.teamColor}` : "#71717a",
        },
        {
            label: "Constructor Leader",
            val: teamLoading ? "..." : topTeam?.teamName,
            sub: "Factory Lead",
            pts: topTeam?.points,
            color: "#71717a",
        },
        {
            label: "Title Fight Gap",
            val:
                leader && runnerUp
                    ? `+${leader.points - runnerUp.points}`
                    : "—",
            sub: "Points Delta",
            pts: null,
            color: "#71717a",
        },
    ];

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 p-4 md:p-6 text-zinc-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 p-6 rounded-2xl bg-zinc-900/40 gap-4">
                    {/* Foreground Content Left */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Race Hub Dashboard
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            Live season telemetry and analytics.
                        </p>
                    </div>

                    {/* Foreground Content Right */}
                    <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 self-start md:self-auto">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-zinc-300 uppercase tracking-wider font-bold">
                            System Connected
                        </span>
                    </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {statsCards.map((card, i) => (
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
                                style={{ color: card.color }}
                            >
                                {card.sub}
                            </p>
                            {card.pts !== null && card.pts !== undefined && (
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
                                <DriverTable standings={standings} limit={7} />
                            ) : (
                                <TeamTable standings={teams} limit={7} />
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
                                <div className="h-44 bg-zinc-900/50 rounded-2xl animate-pulse" />
                            )}
                        </div>

                        {/* LATEST RACE RESULTS */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-2">
                                Latest Race Results
                            </h3>
                            {resultsState.loading ? (
                                <div className="h-44 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl animate-pulse" />
                            ) : resultsState.data.length > 0 ? (
                                <RaceResultsTable
                                    classification={resultsState.data}
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
