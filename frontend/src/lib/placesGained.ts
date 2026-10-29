import { DriverResult, StartingGridEntry, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';
import {
    GridEntry,
    buildGridRaceRows,
    isGrandPrixSession,
    isQualifyingSession,
} from '@/utils/gridVsRace';

export interface PlacesGainedRow {
    driverNumber: number;
    name: string;
    teamName: string;
    teamColor: string;
    netPlaces: number;
    avgPlaces: number;
    races: number;
}

export interface PlacesGainedSummary {
    rows: PlacesGainedRow[];
    racesCounted: number;
    officialGridRaces: number;
}

export function buildPlacesGained(
    rows: SupabaseRaceResultRow[],
    drivers: DriverStanding[]
): PlacesGainedSummary {
    const byMeeting = new Map<
        number,
        { quali?: SupabaseRaceResultRow; race?: SupabaseRaceResultRow }
    >();

    for (const row of rows) {
        const entry = byMeeting.get(row.meeting_key) ?? {};
        if (isQualifyingSession(row.session_name)) entry.quali = row;
        else if (isGrandPrixSession(row.session_name)) entry.race = row;
        byMeeting.set(row.meeting_key, entry);
    }

    const totals = new Map<number, { net: number; races: number }>();
    let racesCounted = 0;
    let officialGridRaces = 0;

    for (const { quali, race } of byMeeting.values()) {
        if (!quali || !race) continue;

        const finish = parseJsonField<DriverResult>(race.classification_json);
        if (finish.length === 0) continue;

        // Official starting grid (with penalties) when stored, otherwise qualifying order.
        const official = parseJsonField<StartingGridEntry>(quali.starting_grid_json);
        const grid: GridEntry[] =
            official.length > 0
                ? official
                : parseJsonField<DriverResult>(quali.classification_json);
        if (grid.length === 0) continue;

        racesCounted++;
        if (official.length > 0) officialGridRaces++;

        // Only classified finishers have a delta, so DNFs don't count as places lost.
        for (const row of buildGridRaceRows(grid, finish)) {
            if (row.delta == null) continue;

            const current = totals.get(row.driverNumber) ?? { net: 0, races: 0 };
            current.net += row.delta;
            current.races++;
            totals.set(row.driverNumber, current);
        }
    }

    const result: PlacesGainedRow[] = [...totals.entries()]
        .map(([driverNumber, t]) => {
            const standing = drivers.find((d) => d.driverNumber === driverNumber);
            return {
                driverNumber,
                name: standing?.driverName ?? `Driver ${driverNumber}`,
                teamName: standing?.teamName ?? 'Unknown',
                teamColor: standing?.teamColor ?? '71717a',
                netPlaces: t.net,
                avgPlaces: t.net / t.races,
                races: t.races,
            };
        })
        .sort((a, b) => b.netPlaces - a.netPlaces || b.avgPlaces - a.avgPlaces);

    return { rows: result, racesCounted, officialGridRaces };
}
