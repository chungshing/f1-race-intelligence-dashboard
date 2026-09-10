import { useEffect, useState } from 'react';
import { getStandings, getRaceResultsWithStints } from '@/lib/app';
import { buildDriverProfile, DriverProfile } from '@/lib/driverProfile';
import { mapDriverStandings } from '@/hooks/useStandings';

export function useDriverProfile(driverNumber: number) {
    const [data, setData] = useState<DriverProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        Promise.all([getStandings(), getRaceResultsWithStints()])
            .then(([rawStandings, raceRows]) => {
                if (!isMounted) return;

                const allDrivers = mapDriverStandings(rawStandings);
                const standing = allDrivers.find((d) => d.driverNumber === driverNumber);

                if (!standing) {
                    setError('Driver not found');
                    return;
                }

                setData(buildDriverProfile(driverNumber, standing, allDrivers, raceRows));
            })
            .catch(() => {
                if (isMounted) setError('Failed to load driver profile');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [driverNumber]);

    return { data, loading, error };
}
