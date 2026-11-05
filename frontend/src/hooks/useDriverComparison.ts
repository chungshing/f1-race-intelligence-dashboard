import { raceWeekendsQuery } from '@/hooks/useRaceWeekends';
import { raceResultsQuery } from '@/hooks/useRaceResults';
import { driverStandingsQuery } from '@/hooks/useStandings';
import { buildDriverComparison, DriverComparisonResult } from '@/lib/driverComparison';
import { useQuery } from '@tanstack/react-query';

export function useDriverComparison(driverANumber: number | null, driverBNumber: number | null) {
    const standingsQuery = useQuery(driverStandingsQuery);
    const raceRowsQuery = useQuery(raceResultsQuery);
    const weekendsQuery = useQuery(raceWeekendsQuery);

    const loading = standingsQuery.isPending || raceRowsQuery.isPending || weekendsQuery.isPending;
    const allDrivers = standingsQuery.data ?? [];

    let data: DriverComparisonResult | null = null;

    if (
        !loading &&
        driverANumber !== null &&
        driverBNumber !== null &&
        raceRowsQuery.data &&
        weekendsQuery.data
    ) {
        const driverA = allDrivers.find((d) => d.driverNumber === driverANumber);
        const driverB = allDrivers.find((d) => d.driverNumber === driverBNumber);

        if (driverA && driverB) {
            data = buildDriverComparison(driverA, driverB, raceRowsQuery.data, weekendsQuery.data);
        }
    }

    return { data, allDrivers, loading };
}
