import { mapDriverStandings, mapTeamStandings } from '@/hooks/useStandings';
import { getRaceResultsWithStints, getStandings, getTeamStandings } from '@/lib/app';
import { buildConstructorProfile, ConstructorProfile } from '@/lib/constructorProfile';
import { useQuery } from '@tanstack/react-query';

export function useConstructorProfile(teamName: string) {
    const driversQuery = useQuery({
        queryKey: ['driverStandings'],
        queryFn: async () => mapDriverStandings(await getStandings()),
    });

    const teamsQuery = useQuery({
        queryKey: ['teamStandings'],
        queryFn: async () => mapTeamStandings(await getTeamStandings()),
    });

    const raceRowsQuery = useQuery({
        queryKey: ['raceResultsWithStints'],
        queryFn: getRaceResultsWithStints,
    });

    const loading = driversQuery.isLoading || teamsQuery.isLoading || raceRowsQuery.isLoading;
    const queryError = driversQuery.error || teamsQuery.error || raceRowsQuery.error;

    let data: ConstructorProfile | null = null;
    let error: string | null = queryError ? 'Failed to load constructor profile' : null;

    if (!loading && !error && driversQuery.data && teamsQuery.data && raceRowsQuery.data) {
        const team = teamsQuery.data.find((t) => t.teamName === teamName);
        if (!team) {
            error = 'Team not found';
        } else {
            data = buildConstructorProfile(team, driversQuery.data, raceRowsQuery.data);
        }
    }

    return { data, loading, error };
}
