import { useEffect, useState } from "react";
import { getStandings, getTeamStandings } from "@/lib/app";
import {
    DriverStanding,
    Team,
    RawDriverStanding,
    RawTeamStanding,
} from "@/types/standing";

// ==========================================
// Data Mapping Helpers
// ==========================================
function mapDriverStandings(apiData: RawDriverStanding[]): DriverStanding[] {
    return apiData.map((item) => {
        const position = Number(item.position);
        const positionsGained = Number(item.positions_gained ?? 0);
        const points = Number(item.points ?? 0);
        const pointsEarned = Number(item.points_earned ?? 0);

        return {
            driverNumber: Number(item.driver_number),
            position,
            positionStart: Number(
                item.position_start ?? position - positionsGained,
            ),
            positionsGained,
            driverName: item.driver_name || "",
            teamName: item.team_name || "",
            points,
            pointsStart: Number(item.points_start ?? points - pointsEarned),
            pointsEarned,
            teamColor: item.team_color || "#CCCCCC",
            headshotUrl: item.headshot_url || null,
        };
    });
}

function mapTeamStandings(apiData: RawTeamStanding[]): Team[] {
    return apiData.map((item) => {
        const position = Number(item.position);
        const positionsGained = Number(item.positions_gained ?? 0);
        const points = Number(item.points ?? 0);
        const pointsEarned = Number(item.points_earned ?? 0);

        return {
            teamName: item.team_name || "",
            position,
            positionStart: Number(
                item.position_start ?? position - positionsGained,
            ),
            positionsGained,
            points,
            pointsStart: Number(item.points_start ?? points - pointsEarned),
            pointsEarned,
        };
    });
}

// ==========================================
// Custom React Hooks
// ==========================================
export function useStandings() {
    const [data, setData] = useState<DriverStanding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        getStandings()
            .then((result) => {
                // result is automatically inferred as RawDriverStanding[]
                if (isMounted) setData(mapDriverStandings(result));
            })
            .catch(() => {
                if (isMounted) setError("Failed to load standings");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { data, loading, error };
}

export function useTeamStandings() {
    const [data, setData] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        getTeamStandings()
            .then((result) => {
                // result is automatically inferred as RawTeamStanding[]
                if (isMounted) setData(mapTeamStandings(result));
            })
            .catch(() => {
                if (isMounted) setError("Failed to load team standings");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { data, loading, error };
}
