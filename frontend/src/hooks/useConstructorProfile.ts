import { useQuery } from '@tanstack/react-query';
import { getStandings, getTeamStandings, getRaceResultsWithStints, getRaces } from '@/lib/app';
import { buildConstructorProfile, ConstructorProfile } from '@/lib/constructorProfile';
import { mapDriverStandings, mapTeamStandings } from '@/hooks/useStandings';
import { mapRaceWeekends } from '@/hooks/useRaceWeekends';

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

    const weekendsQuery = useQuery({
        queryKey: ['raceWeekends'],
        queryFn: async () => mapRaceWeekends(await getRaces()),
    });

    const loading =
        driversQuery.isLoading ||
        teamsQuery.isLoading ||
        raceRowsQuery.isLoading ||
        weekendsQuery.isLoading;
    const queryError =
        driversQuery.error || teamsQuery.error || raceRowsQuery.error || weekendsQuery.error;

    let data: ConstructorProfile | null = null;
    let error: string | null = queryError ? 'Failed to load constructor profile' : null;

    if (
        !loading &&
        !error &&
        driversQuery.data &&
        teamsQuery.data &&
        raceRowsQuery.data &&
        weekendsQuery.data
    ) {
        const team = teamsQuery.data.find((t) => t.teamName === teamName);
        if (!team) {
            error = 'Team not found';
        } else {
            data = buildConstructorProfile(
                team,
                driversQuery.data,
                raceRowsQuery.data,
                weekendsQuery.data
            );
        }
    }

    return { data, loading, error };
}
