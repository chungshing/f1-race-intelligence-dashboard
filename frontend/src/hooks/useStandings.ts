import { useQuery } from "@tanstack/react-query";
import { getStandings, getTeamStandings } from "@/lib/app";
import { DriverStanding, RawDriverStanding, RawTeamStanding, Team } from '@/types/standing';

// ==========================================
// Data Mapping Helpers
// ==========================================
export function mapDriverStandings(apiData: RawDriverStanding[]): DriverStanding[] {
    return apiData.map((item) => {
        const position = Number(item.position);
        const positionsGained = Number(item.positions_gained ?? 0);
        const points = Number(item.points ?? 0);
        const pointsEarned = Number(item.points_earned ?? 0);

        return {
            driverNumber: Number(item.driver_number),
            position,
            positionStart: Number(item.position_start ?? position - positionsGained),
            positionsGained,
            driverName: item.driver_name || '',
            teamName: item.team_name || '',
            points,
            pointsStart: Number(item.points_start ?? points - pointsEarned),
            pointsEarned,
            teamColor: item.team_color || 'CCCCCC',
            headshotUrl: item.headshot_url || null,
        };
    });
}

export function mapTeamStandings(apiData: RawTeamStanding[]): Team[] {
    return apiData.map((item) => {
        const position = Number(item.position);
        const positionsGained = Number(item.positions_gained ?? 0);
        const points = Number(item.points ?? 0);
        const pointsEarned = Number(item.points_earned ?? 0);

        return {
            teamName: item.team_name || '',
            position,
            positionStart: Number(item.position_start ?? position - positionsGained),
            positionsGained,
            points,
            pointsStart: Number(item.points_start ?? points - pointsEarned),
            pointsEarned,
            teamColor: item.team_color || '999999',
        };
    });
}

// ==========================================
// Custom React Hooks
// ==========================================
export function useStandings() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['driverStandings'],
        queryFn: async () => mapDriverStandings(await getStandings()),
    });

    return {
        data: data ?? [],
        loading: isLoading,
        error: error ? 'Failed to load standings' : null,
    };
}

export function useTeamStandings() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['teamStandings'],
        queryFn: async () => mapTeamStandings(await getTeamStandings()),
    });

    return {
        data: data ?? [],
        loading: isLoading,
        error: error ? 'Failed to load team standings' : null,
    };
}
