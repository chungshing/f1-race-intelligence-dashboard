import { mapDriverStandings, mapTeamStandings } from '@/hooks/useStandings';
import { getRaceResultsWithStints, getStandings, getTeamStandings } from '@/lib/app';
import { buildConstructorProfile, ConstructorProfile } from '@/lib/constructorProfile';
import { useEffect, useState } from 'react';

export function useConstructorProfile(teamName: string) {
    const [data, setData] = useState<ConstructorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        Promise.all([getStandings(), getTeamStandings(), getRaceResultsWithStints()])
            .then(([rawDrivers, rawTeams, raceRows]) => {
                if (!isMounted) return;

                const allDrivers = mapDriverStandings(rawDrivers);
                const allTeams = mapTeamStandings(rawTeams);
                const team = allTeams.find((t) => t.teamName === teamName);

                if (!team) {
                    setError('Team not found');
                    return;
                }

                setData(buildConstructorProfile(team, allDrivers, raceRows));
            })
            .catch(() => {
                if (isMounted) setError('Failed to load constructor profile');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [teamName]);

    return { data, loading, error };
}
