import { useEffect, useState } from "react";
import { getRaces } from "@/lib/app";
import { RaceWeekend, SupabaseRaceRow } from "@/types/race";

export function useRaceWeekends() {
    const [data, setData] = useState<RaceWeekend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        getRaces()
            .then((res) => {
                if (!Array.isArray(res)) {
                    throw new Error("Invalid race data format");
                }

                const parsedData: RaceWeekend[] = res.map((race: SupabaseRaceRow) => ({
                    meetingKey: race.meeting_key,
                    circuit: race.circuit,
                    country: race.country,
                    year: race.year,
                    circuitImage: race.circuit_image || "",
                    countryFlag: race.country_flag || "",
                    circuitType: race.circuit_type || "Unknown",
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