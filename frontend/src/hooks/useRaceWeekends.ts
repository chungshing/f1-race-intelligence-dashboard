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
                console.log("RACES API RESPONSE:", res);

                if (!Array.isArray(res)) {
                    throw new Error("Invalid race data format");
                }

                setData(res);
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