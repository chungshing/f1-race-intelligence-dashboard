import { useEffect, useState } from "react";
import { getRaces } from "@/lib/app";
import { RaceWeekend } from "@/types/race";

interface SupabaseRaceRow {
    meeting_key: number;
    circuit: string;
    country: string;
    year: number;
    sessions_json: string;
}

export function useRaceWeekends() {
    const [data, setData] = useState<RaceWeekend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getRaces()
            .then((res: SupabaseRaceRow[]) => {
                // Add type here
                if (!Array.isArray(res)) {
                    throw new Error("Invalid race data format");
                }

                // Explicitly map fields
                const parsedData: RaceWeekend[] = res.map((race) => ({
                    meetingKey: race.meeting_key,
                    circuit: race.circuit,
                    country: race.country,
                    year: race.year,
                    sessions: JSON.parse(race.sessions_json || "[]"),
                }));

                setData(parsedData);
            })
            .catch((err) => {
                console.error("Race API error:", err);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { data, loading, error };
}
