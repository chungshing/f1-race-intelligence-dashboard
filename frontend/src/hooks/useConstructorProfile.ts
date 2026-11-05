import { raceWeekendsQuery } from '@/hooks/useRaceWeekends';
import { raceResultsQuery } from '@/hooks/useRaceResults';
import { driverStandingsQuery, teamStandingsQuery } from '@/hooks/useStandings';
import { buildConstructorProfile, ConstructorProfile } from '@/lib/constructorProfile';
import { useQuery } from '@tanstack/react-query';

export function useConstructorProfile(teamName: string) {
    const driversQuery = useQuery(driverStandingsQuery);
    const teamsQuery = useQuery(teamStandingsQuery);
    const raceRowsQuery = useQuery(raceResultsQuery);
    const weekendsQuery = useQuery(raceWeekendsQuery);

    const loading =
        driversQuery.isPending ||
        teamsQuery.isPending ||
        raceRowsQuery.isPending ||
        weekendsQuery.isPending;
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
