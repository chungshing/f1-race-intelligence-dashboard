import { supabase } from "./supabaseClient";
import { SupabaseRaceRow } from "@/types/race";
import { SupabaseRaceResultRow } from "@/types/results";
import { RawDriverStanding, RawTeamStanding } from "@/types/standing";

/**
 * Fetches driver standings
 * Fields: driverNumber, position, positionStart, positionsGained, driverName, teamName, points, pointsStart, pointsEarned, teamColor, headshotUrl
 */
export async function getStandings(): Promise<RawDriverStanding[]> {
    const { data, error } = await supabase
        .from("driver_standings")
        .select("*")
        .order("position", { ascending: true });

    if (error) {
        console.error("Error fetching driver standings:", error);
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
        .from("team_standings")
        .select("*")
        .order("position", { ascending: true });

    if (error) {
        console.error("Error fetching team standings:", error);
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
        .from("race_weekends")
        .select("*")
        .order("meeting_key", { ascending: true });

    if (error) {
        console.error("Error fetching race weekends:", error);
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Fetches race results with optional filtering by meetingKey
 * Fields: session_key, meeting_key, country, session_name, classification_json
 */
export async function getRaceResults(
    meetingKey: number | null = null,
): Promise<SupabaseRaceResultRow[]> {
    let dbQuery = supabase
        .from("race_results")
        .select(
            "session_key, meeting_key, country, session_name, classification_json",
        );

    if (meetingKey) {
        dbQuery = dbQuery.eq("meeting_key", meetingKey);
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error("Error fetching race results:", error);
        throw new Error(error.message);
    }
    return data || [];
}
