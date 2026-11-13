import { raceResultsQuery } from '@/hooks/useRaceResults';
import { raceWeekendsQuery } from '@/hooks/useRaceWeekends';
import { driverStandingsQuery, teamStandingsQuery } from '@/hooks/useStandings';
import {
    buildConstructorComparison,
    ConstructorComparisonResult,
} from '@/lib/constructorComparison';
import { useQuery } from '@tanstack/react-query';

export function useConstructorComparison(teamAName: string | null, teamBName: string | null) {
    const driversQuery = useQuery(driverStandingsQuery);
    const teamsQuery = useQuery(teamStandingsQuery);
    const raceRowsQuery = useQuery(raceResultsQuery);
    const weekendsQuery = useQuery(raceWeekendsQuery);

    const loading =
        driversQuery.isPending ||
        teamsQuery.isPending ||
        raceRowsQuery.isPending ||
        weekendsQuery.isPending;
    const error =
        driversQuery.error || teamsQuery.error || raceRowsQuery.error || weekendsQuery.error
            ? 'Failed to load constructor data'
            : null;

    const allTeams = teamsQuery.data ?? [];

    let data: ConstructorComparisonResult | null = null;

    if (
        !loading &&
        !error &&
        teamAName &&
        teamBName &&
        driversQuery.data &&
        raceRowsQuery.data &&
        weekendsQuery.data
    ) {
        const teamA = allTeams.find((t) => t.teamName === teamAName);
        const teamB = allTeams.find((t) => t.teamName === teamBName);

        if (teamA && teamB) {
            data = buildConstructorComparison(
                teamA,
                teamB,
                driversQuery.data,
                raceRowsQuery.data,
                weekendsQuery.data
            );
        }
    }

    return { data, allTeams, loading, error };
}
