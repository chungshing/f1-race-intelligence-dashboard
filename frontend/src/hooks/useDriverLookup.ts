import { useStandings } from '@/hooks/useStandings';
import { formatHexColor } from '@/utils/sessions';
import { useMemo } from 'react';

export const useDriverLookup = () => {
    const { data: standings } = useStandings();

    return useMemo(() => {
        const lookup: Record<number, { name: string; team: string; teamColor: string }> = {};

        standings.forEach((d) => {
            lookup[d.driverNumber] = {
                name: d.driverName,
                team: d.teamName,
                teamColor: formatHexColor(d.teamColor),
            };
        });

        return lookup;
    }, [standings]);
};
