import { useEffect, useState } from "react";
import { getRaces } from "@/lib/app";
import { RaceWeekend } from "@/types/race";

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

                // Map over the response and parse the stringified sessions
                const parsedData = res.map((race) => ({
                    ...race,
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
