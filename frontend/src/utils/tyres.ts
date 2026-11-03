import { SupabaseLapRow } from '@/types/laps';
import { Stint } from '@/types/results';
import { SafetyCarWindow, isLapUnderSafetyCar } from '@/utils/raceControl';

export const DRY_COMPOUNDS = ['SOFT', 'MEDIUM', 'HARD'] as const;
export type DryCompound = (typeof DRY_COMPOUNDS)[number];

const MIN_CLEAN_LAPS = 6;
const OUTLIER_FACTOR = 1.05;
const MAX_CURVE_LAPS = 35;

export interface CompoundSummary {
    compound: DryCompound;
    stints: number;
    avgStintLaps: number;
    degPerLap: number;
}

export interface DegradationCurveRow {
    lapIntoStint: number;
    [compound: string]: number | null;
}

export interface TyreDegradation {
    summaries: CompoundSummary[];
    curve: DegradationCurveRow[];
    compounds: DryCompound[];
}

interface Point {
    x: number;
    y: number;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function slope(points: Point[]): number {
    const n = points.length;
    const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (const p of points) {
        numerator += (p.x - meanX) * (p.y - meanY);
        denominator += (p.x - meanX) ** 2;
    }
    return denominator === 0 ? 0 : numerator / denominator;
}

function toDryCompound(raw: string): DryCompound | null {
    const upper = raw.toUpperCase();
    return (DRY_COMPOUNDS as readonly string[]).includes(upper) ? (upper as DryCompound) : null;
}

/**
 * Lap time change per lap of tyre use, from stint data and lap times.
 * Excludes lap 1, pit in/out laps, safety car laps and slow outliers.
 * Not fuel-corrected: lap times fall as fuel burns off, so real wear is steeper.
 */
export function buildTyreDegradation(
    stints: Stint[],
    rawLaps: SupabaseLapRow[],
    safetyCarWindows: SafetyCarWindow[]
): TyreDegradation {
    const lapsByDriver = new Map<number, Map<number, { duration: number; pitOut: boolean }>>();
    for (const lap of rawLaps) {
        if (!lap.lap_duration || lap.lap_duration <= 0) continue;

        const driverLaps = lapsByDriver.get(lap.driver_number) ?? new Map();
        driverLaps.set(lap.lap_number, { duration: lap.lap_duration, pitOut: lap.is_pit_out_lap });
        lapsByDriver.set(lap.driver_number, driverLaps);
    }

    const lastStintByDriver = new Map<number, number>();
    for (const stint of stints) {
        lastStintByDriver.set(
            stint.driver_number,
            Math.max(lastStintByDriver.get(stint.driver_number) ?? 0, stint.stint_number)
        );
    }

    const degByCompound = new Map<DryCompound, number[]>();
    const lengthsByCompound = new Map<DryCompound, number[]>();
    const deltasByCompound = new Map<DryCompound, Map<number, number[]>>();

    for (const stint of stints) {
        const compound = toDryCompound(stint.compound);
        const driverLaps = lapsByDriver.get(stint.driver_number);
        if (!compound || !driverLaps) continue;

        const isFinalStint = stint.stint_number === lastStintByDriver.get(stint.driver_number);

        const points: Point[] = [];
        for (let lap = stint.lap_start; lap <= stint.lap_end; lap++) {
            const entry = driverLaps.get(lap);
            if (!entry || entry.pitOut || lap === 1) continue;
            if (lap === stint.lap_end && !isFinalStint) continue;
            if (isLapUnderSafetyCar(lap, safetyCarWindows)) continue;

            points.push({ x: lap - stint.lap_start, y: entry.duration });
        }

        if (points.length < MIN_CLEAN_LAPS) continue;

        const cutoff = median(points.map((p) => p.y)) * OUTLIER_FACTOR;
        const clean = points.filter((p) => p.y <= cutoff);
        if (clean.length < MIN_CLEAN_LAPS) continue;

        degByCompound.set(compound, [...(degByCompound.get(compound) ?? []), slope(clean)]);
        lengthsByCompound.set(compound, [
            ...(lengthsByCompound.get(compound) ?? []),
            stint.lap_end - stint.lap_start + 1,
        ]);

        const baseline = clean.slice(0, 3).reduce((sum, p) => sum + p.y, 0) / 3;
        const byAge = deltasByCompound.get(compound) ?? new Map<number, number[]>();
        for (const p of clean) {
            if (p.x > MAX_CURVE_LAPS) continue;
            byAge.set(p.x, [...(byAge.get(p.x) ?? []), p.y - baseline]);
        }
        deltasByCompound.set(compound, byAge);
    }

    const compounds = DRY_COMPOUNDS.filter((c) => degByCompound.has(c));

    const summaries: CompoundSummary[] = compounds.map((compound) => ({
        compound,
        stints: degByCompound.get(compound)!.length,
        avgStintLaps:
            lengthsByCompound.get(compound)!.reduce((sum, n) => sum + n, 0) /
            lengthsByCompound.get(compound)!.length,
        degPerLap: median(degByCompound.get(compound)!),
    }));

    // Average delta per lap-into-stint, only where at least two stints contribute.
    const curve: DegradationCurveRow[] = [];
    for (let age = 0; age <= MAX_CURVE_LAPS; age++) {
        const row: DegradationCurveRow = { lapIntoStint: age };
        let hasValue = false;

        for (const compound of compounds) {
            const values = deltasByCompound.get(compound)?.get(age);
            if (values && values.length >= 2) {
                row[compound] = values.reduce((sum, v) => sum + v, 0) / values.length;
                hasValue = true;
            } else {
                row[compound] = null;
            }
        }

        if (hasValue) curve.push(row);
    }

    return { summaries, curve, compounds };
}
