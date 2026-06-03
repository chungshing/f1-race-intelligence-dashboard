/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { getStandings } from "@/lib/app";
import { DriverStanding } from "@/types/shared";

export function useStandings() {
    const [data, setData] = useState<DriverStanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await getStandings();
                setData(result);
            } catch (err) {
                setError("Failed to load standings");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    return { data, loading, error };
}