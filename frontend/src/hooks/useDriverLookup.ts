import { useEffect, useState } from 'react';
import { getStandings } from '@/lib/app';

export const useDriverLookup = () => {
    const [lookup, setLookup] = useState<
        Record<number, { name: string; team: string; teamColor: string }>
    >({});

    useEffect(() => {
        async function buildLookup() {
            const data = await getStandings();

            const newLookup: Record<number, { name: string; team: string; teamColor: string }> = {};

            data.forEach((d) => {
                const driverNumber = Number(d.driver_number);
                if (isNaN(driverNumber)) return;

                const rawColor = d.team_color || '3f3f46';
                const formattedColor = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;

                newLookup[driverNumber] = {
                    name: d.driver_name || 'Unknown Driver',
                    team: d.team_name || 'Unknown Team',
                    teamColor: formattedColor, 
                };
            });

            setLookup(newLookup);
        }
        buildLookup();
    }, []);

    return lookup;
};
