import { useEffect, useState } from "react";
import { getStandings, getTeamStandings } from "@/lib/app";
import { DriverStanding, Team } from "@/types/shared";

// ==========================================
// API Response Type Definitions
// ==========================================
interface RawDriverStanding {
    driver_number: number | string;
    position: number | string;
    position_start?: number | string | null;
    positions_gained?: number | string | null;
    driver_name?: string | null;
    team_name?: string | null;
    points?: number | string | null;
    points_start?: number | string | null;
    points_earned?: number | string | null;
    team_color?: string | null;
    headshot_url?: string | null;
}

interface RawTeamStanding {
    team_name?: string | null;
    position: number | string;
    position_start?: number | string | null;
    positions_gained?: number | string | null;
    points?: number | string | null;
    points_start?: number | string | null;
    points_earned?: number | string | null;
}

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
        async function load() {
            try {
                // Ensure your lib function signature returns the matching raw type array or un-typed data casted to it
                const result = (await getStandings()) as RawDriverStanding[];
                setData(mapDriverStandings(result));
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

export function useTeamStandings() {
    const [data, setData] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = (await getTeamStandings()) as RawTeamStanding[];
                setData(mapTeamStandings(result));
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
