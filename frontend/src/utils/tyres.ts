import { SupabaseLapRow } from '@/types/laps';
import { Stint } from '@/types/results';
import { SafetyCarWindow, isLapUnderSafetyCar } from '@/utils/raceControl';

export const COMPOUNDS = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'] as const;
export type Compound = (typeof COMPOUNDS)[number];

const MIN_CLEAN_LAPS = 4;
const OUTLIER_SECONDS = 3; // drop laps this much slower than the stint's typical gap to the field
const MIN_CARS_FOR_REFERENCE = 5;
const MAX_CURVE_LAPS = 80;
const MIN_STINTS_PER_POINT = 1;
const SMOOTHING_RADIUS = 2; // laps either side, so a 5-lap moving average

export interface CompoundSummary {
    compound: Compound;
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
    compounds: Compound[];
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

function toCompound(raw: string): Compound | null {
    const upper = raw.toUpperCase();
    return (COMPOUNDS as readonly string[]).includes(upper) ? (upper as Compound) : null;
}

/**
 * Lap time change per lap of tyre use, from stint data and lap times.
 * Every lap is measured against the field's median lap time on that same lap, which cancels
 * fuel burn and changing track conditions (drying, rubbering in) that affect all cars at once.
 * Excludes lap 1, pit in/out laps, safety car laps and slow outliers.
 */
export function buildTyreDegradation(
    stints: Stint[],
    rawLaps: SupabaseLapRow[],
    safetyCarWindows: SafetyCarWindow[]
): TyreDegradation {
    const lapsByDriver = new Map<number, Map<number, { duration: number; pitOut: boolean }>>();
    const durationsByLap = new Map<number, number[]>();

    for (const lap of rawLaps) {
        if (!lap.lap_duration || lap.lap_duration <= 0) continue;

        const driverLaps = lapsByDriver.get(lap.driver_number) ?? new Map();
        driverLaps.set(lap.lap_number, { duration: lap.lap_duration, pitOut: lap.is_pit_out_lap });
        lapsByDriver.set(lap.driver_number, driverLaps);

        if (!lap.is_pit_out_lap) {
            const list = durationsByLap.get(lap.lap_number) ?? [];
            list.push(lap.lap_duration);
            durationsByLap.set(lap.lap_number, list);
        }
    }

    // Field reference: median lap time of all cars on each race lap.
    const fieldMedian = new Map<number, number>();
    for (const [lap, durations] of durationsByLap) {
        if (durations.length >= MIN_CARS_FOR_REFERENCE) fieldMedian.set(lap, median(durations));
    }

    const lastStintByDriver = new Map<number, number>();
    for (const stint of stints) {
        lastStintByDriver.set(
            stint.driver_number,
            Math.max(lastStintByDriver.get(stint.driver_number) ?? 0, stint.stint_number)
        );
    }

    const degByCompound = new Map<Compound, number[]>();
    const lengthsByCompound = new Map<Compound, number[]>();
    const deltasByCompound = new Map<Compound, Map<number, number[]>>();

    for (const stint of stints) {
        const compound = toCompound(stint.compound);
        const driverLaps = lapsByDriver.get(stint.driver_number);
        if (!compound || !driverLaps) continue;

        const isFinalStint = stint.stint_number === lastStintByDriver.get(stint.driver_number);

        const points: Point[] = [];
        for (let lap = stint.lap_start; lap <= stint.lap_end; lap++) {
            const entry = driverLaps.get(lap);
            const reference = fieldMedian.get(lap);
            if (!entry || entry.pitOut || lap === 1 || reference === undefined) continue;
            if (lap === stint.lap_end && !isFinalStint) continue;
            if (isLapUnderSafetyCar(lap, safetyCarWindows)) continue;

            points.push({ x: lap - stint.lap_start, y: entry.duration - reference });
        }

        if (points.length < MIN_CLEAN_LAPS) continue;

        const cutoff = median(points.map((p) => p.y)) + OUTLIER_SECONDS;
        const clean = points.filter((p) => p.y <= cutoff);
        if (clean.length < MIN_CLEAN_LAPS) continue;

        degByCompound.set(compound, [...(degByCompound.get(compound) ?? []), slope(clean)]);
        lengthsByCompound.set(compound, [
            ...(lengthsByCompound.get(compound) ?? []),
            stint.lap_end - stint.lap_start + 1,
        ]);

        const baselineLaps = clean.slice(0, 3);
        const baseline = baselineLaps.reduce((sum, p) => sum + p.y, 0) / baselineLaps.length;
        const byAge = deltasByCompound.get(compound) ?? new Map<number, number[]>();
        for (const p of clean) {
            if (p.x > MAX_CURVE_LAPS) continue;
            byAge.set(p.x, [...(byAge.get(p.x) ?? []), p.y - baseline]);
        }
        deltasByCompound.set(compound, byAge);
    }

    const compounds = COMPOUNDS.filter((c) => degByCompound.has(c));

    const summaries: CompoundSummary[] = compounds.map((compound) => ({
        compound,
        stints: degByCompound.get(compound)!.length,
        avgStintLaps:
            lengthsByCompound.get(compound)!.reduce((sum, n) => sum + n, 0) /
            lengthsByCompound.get(compound)!.length,
        degPerLap: median(degByCompound.get(compound)!),
    }));

    // Median delta per lap-into-stint, then lightly smoothed with a moving average.
    const medians = new Map<Compound, Map<number, number>>();
    for (const compound of compounds) {
        const byAge = new Map<number, number>();
        for (const [age, values] of deltasByCompound.get(compound) ?? []) {
            if (age <= MAX_CURVE_LAPS && values.length >= MIN_STINTS_PER_POINT) {
                byAge.set(age, median(values));
            }
        }
        medians.set(compound, byAge);
    }

    const curve: DegradationCurveRow[] = [];
    for (let age = 0; age <= MAX_CURVE_LAPS; age++) {
        const row: DegradationCurveRow = { lapIntoStint: age };
        let hasValue = false;

        for (const compound of compounds) {
            const byAge = medians.get(compound)!;
            if (!byAge.has(age)) {
                row[compound] = null;
                continue;
            }

            const window: number[] = [];
            for (let offset = -SMOOTHING_RADIUS; offset <= SMOOTHING_RADIUS; offset++) {
                const value = byAge.get(age + offset);
                if (value !== undefined) window.push(value);
            }
            row[compound] = window.reduce((sum, v) => sum + v, 0) / window.length;
            hasValue = true;
        }

        if (hasValue) curve.push(row);
    }

    return { summaries, curve, compounds };
}
