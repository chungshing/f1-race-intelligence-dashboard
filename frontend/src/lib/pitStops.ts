import { PitStop, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';

export interface TeamPitRound {
    meetingKey: number;
    country: string;
    best: number;
    median: number;
    stops: number;
}

export interface TeamPitSummary {
    bestStop: number | null;
    medianStop: number | null;
    totalStops: number;
    rank: number | null;
    teamsRanked: number;
    usingLaneDuration: boolean;
    rounds: TeamPitRound[];
}

interface TeamStop {
    team: string;
    meetingKey: number;
    country: string;
    stop: number | null;
    lane: number | null;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function buildTeamPitSummary(
    teamName: string,
    allDrivers: DriverStanding[],
    raceRows: SupabaseRaceResultRow[],
    meetingOrder: number[]
): TeamPitSummary {
    const teamByDriver = new Map<number, string>(
        allDrivers.map((d): [number, string] => [d.driverNumber, d.teamName])
    );

    const stops: TeamStop[] = [];
    for (const row of raceRows) {
        if (row.session_name !== 'Race') continue;

        for (const pit of parseJsonField<PitStop>(row.pit_stops_json)) {
            const team = teamByDriver.get(pit.driver_number);
            if (!team) continue;

            stops.push({
                team,
                meetingKey: row.meeting_key,
                country: row.country,
                stop: pit.stop_duration ?? null,
                lane: pit.lane_duration ?? null,
            });
        }
    }

    // One measure for every team so the ranking is comparable: stationary time when
    // OpenF1 provides it, otherwise pit lane time for everyone.
    const useStopDuration = stops.some((s) => s.stop != null && s.stop > 0);

    const timed = stops.flatMap((s) => {
        const duration = useStopDuration ? s.stop : s.lane;
        return duration != null && duration > 0 ? [{ ...s, duration }] : [];
    });

    const byTeam = new Map<string, number[]>();
    for (const s of timed) {
        const list = byTeam.get(s.team) ?? [];
        list.push(s.duration);
        byTeam.set(s.team, list);
    }

    // Median, so one repair stop or penalty doesn't wreck a team's ranking.
    const ranked = [...byTeam.entries()]
        .map(([team, durations]) => ({ team, median: median(durations) }))
        .sort((a, b) => a.median - b.median);
    const rankIndex = ranked.findIndex((r) => r.team === teamName);

    const mine = timed.filter((s) => s.team === teamName);

    const rounds: TeamPitRound[] = [];
    for (const meetingKey of meetingOrder) {
        const inRound = mine.filter((s) => s.meetingKey === meetingKey);
        if (inRound.length === 0) continue;

        const durations = inRound.map((s) => s.duration);
        rounds.push({
            meetingKey,
            country: inRound[0].country,
            best: Math.min(...durations),
            median: median(durations),
            stops: durations.length,
        });
    }

    const all = mine.map((s) => s.duration);

    return {
        bestStop: all.length ? Math.min(...all) : null,
        medianStop: all.length ? median(all) : null,
        totalStops: all.length,
        rank: rankIndex >= 0 ? rankIndex + 1 : null,
        teamsRanked: ranked.length,
        usingLaneDuration: !useStopDuration,
        rounds,
    };
}
