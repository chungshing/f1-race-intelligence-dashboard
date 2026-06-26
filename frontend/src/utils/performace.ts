import { ChartLapData, SupabaseLapRow } from '@/types/laps';
import { PitStop } from '@/types/results';

export interface SectorSpeedLeader {
    driverNumber: number;
    sector1Max: number;
    sector2Max: number;
    sector3Max: number;
}

export interface PaceConsistencyRow {
    driverNumber: number;
    averageLapTime: number;
    lapVariance: number;
}

export interface DriverPitSummary {
    driverNumber: number;
    bestStop: number;
    avgStop: number;
    totalStops: number;
}

export function buildSessionChartData(rawLaps: SupabaseLapRow[]): ChartLapData[] {
    const lapMap = new Map<number, ChartLapData>();

    rawLaps.forEach((row) => {
        const lapNum = row.lap_number;
        if (!lapNum || row.is_pit_out_lap || !row.lap_duration) return;

        if (!lapMap.has(lapNum)) lapMap.set(lapNum, { lap: lapNum });
        lapMap.get(lapNum)![String(row.driver_number)] = row.lap_duration;
    });

    return Array.from(lapMap.values()).sort((a, b) => a.lap - b.lap);
}

export function buildSectorSpeedLeaders(rawLaps: SupabaseLapRow[]): SectorSpeedLeader[] {
    if (!rawLaps.length) return [];

    const driversMap: Record<number, { s1: number; s2: number; s3: number }> = {};

    rawLaps.forEach((row) => {
        const dNum = row.driver_number;
        if (!driversMap[dNum]) driversMap[dNum] = { s1: 0, s2: 0, s3: 0 };
        driversMap[dNum].s1 = Math.max(driversMap[dNum].s1, row.i1_speed || 0);
        driversMap[dNum].s2 = Math.max(driversMap[dNum].s2, row.i2_speed || 0);
        driversMap[dNum].s3 = Math.max(driversMap[dNum].s3, row.st_speed || 0);
    });

    return Object.entries(driversMap).map(([driverNumber, speeds]) => ({
        driverNumber: Number(driverNumber),
        sector1Max: speeds.s1,
        sector2Max: speeds.s2,
        sector3Max: speeds.s3,
    }));
}

export function buildPaceConsistency(rawLaps: SupabaseLapRow[]): PaceConsistencyRow[] {
    if (!rawLaps.length) return [];

    const driverLapsMap: Record<number, number[]> = {};

    rawLaps.forEach((row) => {
        if (!row.is_pit_out_lap && row.lap_duration) {
            const dNum = row.driver_number;
            if (!driverLapsMap[dNum]) driverLapsMap[dNum] = [];
            driverLapsMap[dNum].push(row.lap_duration);
        }
    });

    return Object.entries(driverLapsMap).map(([driverStr, times]) => {
        const driverNumber = Number(driverStr);
        if (!times.length) return { driverNumber, averageLapTime: 0, lapVariance: 0 };

        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
        const stdDev = Math.sqrt(
            times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length,
        );

        return { driverNumber, averageLapTime: avg, lapVariance: stdDev };
    });
}

export function buildPitStopLeaderboard(pitStops: PitStop[]): DriverPitSummary[] {
    const map: Record<number, number[]> = {};

    for (const pit of pitStops) {
        if (!pit.stop_duration) continue;
        if (!map[pit.driver_number]) map[pit.driver_number] = [];
        map[pit.driver_number].push(pit.stop_duration);
    }

    return Object.entries(map)
        .map(([driverNumber, stops]) => ({
            driverNumber: Number(driverNumber),
            bestStop: Math.min(...stops),
            avgStop: stops.reduce((s, t) => s + t, 0) / stops.length,
            totalStops: stops.length,
        }))
        .sort((a, b) => a.bestStop - b.bestStop);
}