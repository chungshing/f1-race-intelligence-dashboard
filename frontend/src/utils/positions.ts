import { SupabaseLapRow } from '@/types/laps';

interface GridLike {
    driverNumber: number;
    position: number | null;
}

export interface PositionChartRow {
    lap: number;
    [driverNumber: string]: number | null;
}

export interface PositionChart {
    rows: PositionChartRow[];
    maxPosition: number;
    minLap: number;
    maxLap: number;
}

export function buildPositionByLap(
    rawLaps: SupabaseLapRow[],
    grid: GridLike[] = []
): PositionChart {
    const starts = new Map<number, Map<number, number>>();
    const durations = new Map<number, Map<number, number>>();
    const drivers = new Set<number>();
    let maxLap = 0;

    for (const row of rawLaps) {
        if (!row.lap_number) continue;
        drivers.add(row.driver_number);
        maxLap = Math.max(maxLap, row.lap_number);

        if (row.date_start) {
            const time = Date.parse(row.date_start);
            if (!Number.isNaN(time)) {
                if (!starts.has(row.driver_number)) starts.set(row.driver_number, new Map());
                starts.get(row.driver_number)!.set(row.lap_number, time);
            }
        }

        if (row.lap_duration) {
            if (!durations.has(row.driver_number)) durations.set(row.driver_number, new Map());
            durations.get(row.driver_number)!.set(row.lap_number, row.lap_duration);
        }
    }

    // Time a driver crossed the line at the end of a lap: the next lap's start,
    // or this lap's start + duration for a final lap.
    const endTime = (driver: number, lap: number): number | null => {
        const next = starts.get(driver)?.get(lap + 1);
        if (next != null) return next;

        const start = starts.get(driver)?.get(lap);
        const duration = durations.get(driver)?.get(lap);
        return start != null && duration != null ? start + duration * 1000 : null;
    };

    const rows: PositionChartRow[] = [];
    let maxPosition = 0;

    const gridEntries = grid.filter((g) => g.position != null);
    if (gridEntries.length > 0) {
        const gridRow: PositionChartRow = { lap: 0 };
        for (const entry of gridEntries) {
            gridRow[String(entry.driverNumber)] = entry.position;
            maxPosition = Math.max(maxPosition, entry.position ?? 0);
        }
        rows.push(gridRow);
    }

    for (let lap = 1; lap <= maxLap; lap++) {
        const crossings: { driver: number; time: number }[] = [];
        for (const driver of drivers) {
            const time = endTime(driver, lap);
            if (time != null) crossings.push({ driver, time });
        }
        if (crossings.length === 0) continue;

        crossings.sort((a, b) => a.time - b.time);

        const row: PositionChartRow = { lap };
        crossings.forEach((crossing, index) => {
            row[String(crossing.driver)] = index + 1;
        });
        maxPosition = Math.max(maxPosition, crossings.length);
        rows.push(row);
    }

    return { rows, maxPosition, minLap: rows[0]?.lap ?? 1, maxLap };
}
