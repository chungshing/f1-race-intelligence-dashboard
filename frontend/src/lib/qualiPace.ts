import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';
import { isQualifyingSession } from '@/utils/gridVsRace';

export interface TeamQualiPace {
    teamName: string;
    teamColor: string;
    avgGapPct: number;
    races: number;
}

// Accepts "88.412" or "1:28.412"
function toSeconds(value: string | null | undefined): number | null {
    if (typeof value !== 'string' || !value.trim()) return null;

    const seconds = value
        .trim()
        .split(':')
        .reduce((total, part) => total * 60 + Number(part), 0);

    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function bestTime(result: DriverResult): number | null {
    const raw = Array.isArray(result.formattedDuration)
        ? [...result.formattedDuration].reverse().find((t) => t)
        : result.formattedDuration;
    return toSeconds(raw);
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * Average gap to pole per team, as a percentage of the pole lap time.
 * Each driver's time is the best lap from the last qualifying session they reached,
 * so drivers knocked out early are compared with a faster, later session. It is a
 * rough picture of one-lap pace, not an exact like-for-like gap.
 */
export function buildQualiPace(
    rows: SupabaseRaceResultRow[],
    drivers: DriverStanding[],
    meetingOrder: number[],
    lastN?: number
): TeamQualiPace[] {
    const teamByDriver = new Map<number, { team: string; color: string }>(
        drivers.map((d): [number, { team: string; color: string }] => [
            d.driverNumber,
            { team: d.teamName, color: d.teamColor },
        ])
    );

    const qualiByMeeting = new Map<number, SupabaseRaceResultRow>();
    for (const row of rows) {
        if (isQualifyingSession(row.session_name)) qualiByMeeting.set(row.meeting_key, row);
    }

    let meetings = meetingOrder.filter((key) => qualiByMeeting.has(key));
    if (lastN) meetings = meetings.slice(-lastN);

    const perTeam = new Map<string, { color: string; gaps: number[] }>();

    for (const meetingKey of meetings) {
        const results = parseJsonField<DriverResult>(
            qualiByMeeting.get(meetingKey)!.classification_json
        );

        const times = results.flatMap((r) => {
            const time = bestTime(r);
            return time != null ? [{ driverNumber: r.driverNumber, time }] : [];
        });
        if (times.length < 2) continue;

        const pole = Math.min(...times.map((t) => t.time));

        const raceGaps = new Map<string, number[]>();
        for (const { driverNumber, time } of times) {
            const team = teamByDriver.get(driverNumber);
            if (!team) continue;

            const list = raceGaps.get(team.team) ?? [];
            list.push(((time - pole) / pole) * 100);
            raceGaps.set(team.team, list);

            if (!perTeam.has(team.team)) perTeam.set(team.team, { color: team.color, gaps: [] });
        }

        for (const [teamName, gaps] of raceGaps) {
            perTeam.get(teamName)!.gaps.push(mean(gaps));
        }
    }

    return [...perTeam.entries()]
        .map(([teamName, t]) => ({
            teamName,
            teamColor: t.color,
            avgGapPct: mean(t.gaps),
            races: t.gaps.length,
        }))
        .sort((a, b) => a.avgGapPct - b.avgGapPct);
}
