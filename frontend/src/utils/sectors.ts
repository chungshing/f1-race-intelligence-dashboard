import { SupabaseLapRow } from '@/types/laps';

export interface DriverSectorBests {
    driverNumber: number;
    s1: number | null;
    s2: number | null;
    s3: number | null;
}

export function buildSectorBests(rawLaps: SupabaseLapRow[]): DriverSectorBests[] {
    const map: Record<number, { s1: number | null; s2: number | null; s3: number | null }> = {};

    for (const row of rawLaps) {
        const d = row.driver_number;
        if (!map[d]) map[d] = { s1: null, s2: null, s3: null };

        if (row.duration_sector1 !== null) {
            map[d].s1 =
                map[d].s1 === null
                    ? row.duration_sector1
                    : Math.min(map[d].s1!, row.duration_sector1);
        }
        if (row.duration_sector2 !== null) {
            map[d].s2 =
                map[d].s2 === null
                    ? row.duration_sector2
                    : Math.min(map[d].s2!, row.duration_sector2);
        }
        if (row.duration_sector3 !== null) {
            map[d].s3 =
                map[d].s3 === null
                    ? row.duration_sector3
                    : Math.min(map[d].s3!, row.duration_sector3);
        }
    }

    return Object.entries(map).map(([driverNumber, times]) => ({
        driverNumber: Number(driverNumber),
        ...times,
    }));
}
