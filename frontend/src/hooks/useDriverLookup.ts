import { useEffect, useState } from "react";
import { getStandings } from "@/lib/app";

export const useDriverLookup = () => {
    const [lookup, setLookup] = useState<
        Record<number, { name: string; team: string; team_color: string }>
    >({});

    useEffect(() => {
        async function buildLookup() {
            // TypeScript already knows 'data' is RawDriverStanding[] from getStandings()
            const data = await getStandings();

            const newLookup: Record<
                number,
                { name: string; team: string; team_color: string }
            > = {};

            data.forEach((d) => {
                // TypeScript already knows 'd' is an element of RawDriverStanding
                const driverNumber = Number(d.driver_number);
                if (isNaN(driverNumber)) return;

                const rawColor = d.team_color || "3f3f46";
                const formattedColor = rawColor.startsWith("#")
                    ? rawColor
                    : `#${rawColor}`;

                newLookup[driverNumber] = {
                    name: d.driver_name || "Unknown Driver",
                    team: d.team_name || "Unknown Team",
                    team_color: formattedColor,
                };
            });

            setLookup(newLookup);
        }
        buildLookup();
    }, []);

    return lookup;
};
