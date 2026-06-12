import { useEffect, useState } from "react";
import { getStandings } from "@/lib/app";

interface SupabaseDriverRow {
    driver_number: number;
    driver_name: string;
    team_name: string;
    team_color: string;
}

export const useDriverLookup = () => {
    const [lookup, setLookup] = useState<
        Record<number, { name: string; team: string; team_color: string }>
    >({});

    useEffect(() => {
        async function buildLookup() {
            const data = (await getStandings()) as SupabaseDriverRow[];

            const newLookup: Record<
                number,
                { name: string; team: string; team_color: string }
            > = {};

            data.forEach((d: SupabaseDriverRow) => {
                const rawColor = d.team_color || "3f3f46";
                const formattedColor = rawColor.startsWith("#")
                    ? rawColor
                    : `#${rawColor}`;
                    
                newLookup[d.driver_number] = {
                    name: d.driver_name,
                    team: d.team_name,
                    team_color: formattedColor,
                };
            });

            setLookup(newLookup);
        }
        buildLookup();
    }, []);

    return lookup;
};
