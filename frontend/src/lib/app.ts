import { ChartLapData, SupabaseLapRow } from '@/types/laps';
import { supabase } from './supabaseClient';
import { SupabaseRaceRow } from '@/types/race';
import { SupabaseRaceResultRow } from '@/types/results';
import { RawDriverStanding, RawTeamStanding } from '@/types/standing';

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

/**
 * Fetches driver standings
 * Fields: driverNumber, position, positionStart, positionsGained, driverName, teamName, points, pointsStart, pointsEarned, teamColor, headshotUrl
 */
export async function getStandings(): Promise<RawDriverStanding[]> {
    const { data, error } = await supabase
        .from('driver_standings')
        .select('*')
        .order('position', { ascending: true });

    if (error) {
        console.error('Error fetching driver standings:', error);
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Fetches team standings
 * Fields: teamName, position, positionStart, positionsGained, points, pointsStart, pointsEarned
 */
export async function getTeamStandings(): Promise<RawTeamStanding[]> {
    const { data, error } = await supabase
        .from('team_standings')
        .select('*')
        .order('position', { ascending: true });

    if (error) {
        console.error('Error fetching team standings:', error);
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Fetches all race weekends
 * Fields: meeting_key, country, circuit, year, sessions_json
 */
export async function getRaces(): Promise<SupabaseRaceRow[]> {
    const { data, error } = await supabase
        .from('race_weekends')
        .select('*')
        .order('meeting_key', { ascending: true });

    if (error) {
        console.error('Error fetching race weekends:', error);
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Fetches race results with optional filtering by meetingKey
 * Fields: session_key, meeting_key, country, session_name, classification_json, pit_stops_json, stints_json
 */
export async function getRaceResults(
    meetingKey: number | null = null,
): Promise<SupabaseRaceResultRow[]> {
    let dbQuery = supabase.from('race_results').select('*');

    if (meetingKey) {
        dbQuery = dbQuery.eq('meeting_key', meetingKey);
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error('Error fetching race results:', error);
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Fetches all lap telemetry records for a specific session
 * Fields: session_key, driver_number, lap_number, lap_duration, is_pit_out_lap, segments_sector_1, etc.
 */
export async function getLapsBySession(sessionKey: number): Promise<SupabaseLapRow[]> {
    const { data, error } = await supabase
        .from('laps')
        .select('*')
        .eq('session_key', sessionKey)
        .order('lap_number', { ascending: true });

    if (error) {
        console.error(`Error fetching laps for session ${sessionKey}:`, error);
        throw new Error(error.message);
    }
    return data || [];
}

export async function getSessionChartData(sessionKey: number): Promise<ChartLapData[]> {
    const rawLaps = await getLapsBySession(sessionKey);

    // Group records by lap number
    const lapMap = new Map<number, ChartLapData>();

    rawLaps.forEach((row) => {
        const lapNum = row.lap_number;
        // Skip unusable outlier values or system calculation laps
        if (!lapNum || row.is_pit_out_lap || !row.lap_duration) return;

        if (!lapMap.has(lapNum)) {
            lapMap.set(lapNum, { lap: lapNum });
        }

        const lapData = lapMap.get(lapNum)!;
        // Assign the driver number string as the property key string name
        lapData[String(row.driver_number)] = row.lap_duration;
    });

    // Return chronological sequence sorted by lap count number
    return Array.from(lapMap.values()).sort((a, b) => a.lap - b.lap);
}

/**
 * Calculates max speeds per sector per driver
 */
export async function getSectorSpeedLeaders(sessionKey: number): Promise<SectorSpeedLeader[]> {
    const rawLaps = await getLapsBySession(sessionKey); // Uses your existing Supabase fetcher
    if (!rawLaps || rawLaps.length === 0) return [];

    const driversMap: Record<number, { s1: number; s2: number; s3: number }> = {};

    rawLaps.forEach((row) => {
        const dNum = row.driver_number;
        if (!driversMap[dNum]) {
            driversMap[dNum] = { s1: 0, s2: 0, s3: 0 };
        }
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

/**
 * Calculates standard deviation (variance) of clean lap times per driver
 */
export async function getPaceConsistency(sessionKey: number): Promise<PaceConsistencyRow[]> {
    const rawLaps = await getLapsBySession(sessionKey);
    if (!rawLaps || rawLaps.length === 0) return [];

    const driverLapsMap: Record<number, number[]> = {};

    rawLaps.forEach((row) => {
        // Filter out pit laps or null anomalies to keep baseline race data clean
        if (!row.is_pit_out_lap && row.lap_duration) {
            const dNum = row.driver_number;
            if (!driverLapsMap[dNum]) driverLapsMap[dNum] = [];
            driverLapsMap[dNum].push(row.lap_duration);
        }
    });

    return Object.entries(driverLapsMap).map(([driverStr, times]) => {
        const driverNumber = Number(driverStr);
        if (times.length === 0) return { driverNumber, averageLapTime: 0, lapVariance: 0 };

        const avg = times.reduce((sum, t) => sum + t, 0) / times.length;

        // Calculate standard deviation variance values
        const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);

        return {
            driverNumber,
            averageLapTime: avg,
            lapVariance: stdDev,
        };
    });
}
