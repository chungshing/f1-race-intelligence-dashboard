import { DriverResult, RaceResult } from '@/types/results';

export type GridRacePairKind = 'race' | 'sprint';

export interface GridRacePair {
    kind: GridRacePairKind;
    label: string;
    gridSession: RaceResult;
    raceSession: RaceResult;
}

export interface GridRaceRow {
    driverNumber: number;
    gridPosition: number | null;
    finishPosition: number | null;
    delta: number | null;
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
    statusLabel: string | null;
}

const normalize = (name: string) => name.trim().toLowerCase();

export function isSprintQualifyingSession(name: string): boolean {
    const n = normalize(name);
    return n.includes('sprint qualifying') || n.includes('sprint shootout');
}

export function isQualifyingSession(name: string): boolean {
    const n = normalize(name);
    return n.includes('qualifying') && !n.includes('sprint');
}

export function isSprintRaceSession(name: string): boolean {
    const n = normalize(name);
    return n === 'sprint' || n === 'sprint race';
}

export function isGrandPrixSession(name: string): boolean {
    const n = normalize(name);
    return n === 'race';
}

export function findGridRacePairs(results: RaceResult[]): GridRacePair[] {
    const qualifying = results.find((r) => isQualifyingSession(r.sessionName));
    const race = results.find((r) => isGrandPrixSession(r.sessionName));
    const sprintQualifying = results.find((r) => isSprintQualifyingSession(r.sessionName));
    const sprint = results.find((r) => isSprintRaceSession(r.sessionName));

    const pairs: GridRacePair[] = [];

    if (sprintQualifying && sprint) {
        pairs.push({
            kind: 'sprint',
            label: 'Sprint',
            gridSession: sprintQualifying,
            raceSession: sprint,
        });
    }

    if (qualifying && race) {
        pairs.push({
            kind: 'race',
            label: 'Grand Prix',
            gridSession: qualifying,
            raceSession: race,
        });
    }

    return pairs;
}

function statusLabel(result: DriverResult | undefined): string | null {
    if (!result) return null;
    if (result.dsq) return 'DSQ';
    if (result.dnf) return 'DNF';
    if (result.dns) return 'DNS';
    return null;
}

export function buildGridRaceRows(
    grid: DriverResult[],
    finish: DriverResult[]
): GridRaceRow[] {
    const driverNumbers = new Set<number>();
    grid.forEach((r) => driverNumbers.add(r.driverNumber));
    finish.forEach((r) => driverNumbers.add(r.driverNumber));

    return Array.from(driverNumbers)
        .map((driverNumber) => {
            const gridResult = grid.find((r) => r.driverNumber === driverNumber);
            const finishResult = finish.find((r) => r.driverNumber === driverNumber);
            const gridPosition = gridResult?.position ?? null;
            const finishPosition = finishResult?.position ?? null;
            const classified =
                finishPosition != null && !finishResult?.dnf && !finishResult?.dns && !finishResult?.dsq;
            const delta =
                classified && gridPosition != null && finishPosition != null
                    ? gridPosition - finishPosition
                    : null;

            return {
                driverNumber,
                gridPosition,
                finishPosition,
                delta,
                dnf: !!finishResult?.dnf,
                dns: !!finishResult?.dns,
                dsq: !!finishResult?.dsq,
                statusLabel: statusLabel(finishResult),
            };
        })
        .sort((a, b) => {
            const aPos = a.finishPosition ?? 900;
            const bPos = b.finishPosition ?? 900;
            const aWeight = a.dsq ? 920 : a.dns ? 930 : a.dnf ? 910 : aPos;
            const bWeight = b.dsq ? 920 : b.dns ? 930 : b.dnf ? 910 : bPos;
            return aWeight - bWeight;
        });
}

export function summarizeGridRace(rows: GridRaceRow[]) {
    const withDelta = rows.filter((r) => r.delta != null) as Array<GridRaceRow & { delta: number }>;
    const biggestGainer = withDelta.reduce<GridRaceRow | null>(
        (best, row) => (!best || row.delta > (best.delta ?? -Infinity) ? row : best),
        null
    );
    const biggestDrop = withDelta.reduce<GridRaceRow | null>(
        (worst, row) => (!worst || row.delta < (worst.delta ?? Infinity) ? row : worst),
        null
    );
    const placesChanged = withDelta.filter((r) => r.delta !== 0).length;
    const netPlacesSwung = Math.round(
        withDelta.reduce((sum, r) => sum + Math.abs(r.delta), 0) / 2
    );

    return { biggestGainer, biggestDrop, placesChanged, netPlacesSwung };
}
