/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Team } from "@/types/shared";
import { getTeamStandings } from "@/lib/app";

export function useTeamStandings() {
    const [data, setData] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await getTeamStandings();
                setData(result);
            } catch (err) {
                setError("Failed to load team standings");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    return { data, loading, error };
}