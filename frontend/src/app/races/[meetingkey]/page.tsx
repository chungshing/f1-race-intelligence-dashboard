"use client";

import { useEffect, useState, use } from "react";
import { getRaceResults } from "@/lib/app";
import { useDriverLookup } from "@/hooks/useDriverLookup";
import { RaceResultsTable } from "@/components/RaceResultsTable";
import { DriverResult, RaceResult } from "@/types/results";
import AppLayout from "@/components/layout/AppLayout";

interface SupabaseRaceRow {
    session_key: number;
    meeting_key: number;
    country: string;
    session_name: string;
    classification_json: string | DriverResult[];
}

export default function RacePage({
    params,
}: {
    params: Promise<{ meetingkey: string }>;
}) {
    const [results, setResults] = useState<RaceResult[]>([]);
    const [activeSessionKey, setActiveSessionKey] = useState<number | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const driverLookup = useDriverLookup();
    const { meetingkey } = use(params);

    useEffect(() => {
        let isMounted = true;

        getRaceResults(Number(meetingkey)).then((data: SupabaseRaceRow[]) => {
            if (!isMounted) return;

            const normalizedResults: RaceResult[] = data.map((r) => {
                let classification = r.classification_json;

                // Handle the stringified JSON from Supabase
                if (typeof classification === "string") {
                    try {
                        classification = JSON.parse(classification);
                    } catch {
                        classification = [];
                    }
                }

                return {
                    sessionKey: r.session_key,
                    meetingKey: r.meeting_key,
                    country: r.country,
                    sessionName: r.session_name,
                    classification: Array.isArray(classification)
                        ? classification
                        : [],
                };
            });

            setResults(normalizedResults);
            if (normalizedResults.length > 0) {
                setActiveSessionKey(normalizedResults[0].sessionKey);
            }
            setLoading(false);
        });

        return () => {
            isMounted = false;
        };
    }, [meetingkey]);

    const activeRace = results.find((r) => r.sessionKey === activeSessionKey);

    if (loading)
        return (
            <AppLayout>
                <div className="p-6 text-center">Loading...</div>
            </AppLayout>
        );

    return (
        <AppLayout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="border-l-4 border-blue-500 pl-4 mb-8">
                    <h1 className="text-4xl font-black text-white">
                        {results[0]?.country || "Race"} Grand Prix
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 border-b border-zinc-800">
                    {results.map((race) => (
                        <button
                            key={race.sessionKey}
                            onClick={() => setActiveSessionKey(race.sessionKey)}
                            className={`px-4 py-2 text-sm font-bold transition-colors ${
                                activeSessionKey === race.sessionKey
                                    ? "text-blue-500 border-b-2 border-blue-500"
                                    : "text-zinc-500 hover:text-zinc-300"
                            }`}
                        >
                            {race.sessionName}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeRace && (
                    <section className="animate-in fade-in duration-300">
                        <RaceResultsTable
                            classification={activeRace.classification}
                            lookup={driverLookup}
                        />
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
