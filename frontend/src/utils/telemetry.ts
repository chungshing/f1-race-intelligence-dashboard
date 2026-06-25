import { SupabaseLapRow } from '@/types/laps';

const SEGMENT_PRIORITY: Record<number, number> = {
    2068: 6, // red    - worst
    2064: 5, // pit
    2048: 4, // yellow
    2050: 3, // gray
    2049: 2, // green
    2051: 1, // purple - best
    0:    0, // none
};

export const parseSegments = (field: string | number[] | null | undefined): number[] => {
    if (!field) return [];
    if (typeof field === 'string') {
        try {
            return (JSON.parse(field) as (number | null)[]).filter((v): v is number => v !== null);
        } catch {
            return [];
        }
    }
    return field;
};

export function getBestSegmentStatus(codes: number[]): number {
    if (codes.length === 0) return 0;
    return codes.reduce((best, code) => {
        const p = SEGMENT_PRIORITY[code] ?? 0;
        return p > (SEGMENT_PRIORITY[best] ?? 0) ? code : best;
    }, 0);
}

export interface HeatmapCell {
    lapNumber: number;
    bestCode: number;
}

export interface HeatmapDriverRow {
    driverNumber: number;
    laps: HeatmapCell[];
}

export function buildSessionHeatmap(rawLaps: SupabaseLapRow[]): HeatmapDriverRow[] {
    const driverMap = new Map<number, Map<number, number>>();

    for (const row of rawLaps) {
        const { driver_number, lap_number } = row;
        if (!lap_number) continue;

        const segments = [
            ...parseSegments(row.segments_sector_1),
            ...parseSegments(row.segments_sector_2),
            ...parseSegments(row.segments_sector_3),
        ];

        const bestCode = getBestSegmentStatus(segments);

        if (!driverMap.has(driver_number)) driverMap.set(driver_number, new Map());
        driverMap.get(driver_number)!.set(lap_number, bestCode);
    }

    return Array.from(driverMap.entries()).map(([driverNumber, lapMap]) => ({
        driverNumber,
        laps: Array.from(lapMap.entries())
            .map(([lapNumber, bestCode]) => ({ lapNumber, bestCode }))
            .sort((a, b) => a.lapNumber - b.lapNumber),
    }));
}
