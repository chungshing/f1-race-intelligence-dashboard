import {
    buildConstructorProfile,
    ConstructorProfile,
    DriverContribution,
} from '@/lib/constructorProfile';
import { bestTime } from '@/lib/qualiPace';
import { getChronologicalMeetingOrder } from '@/lib/racePoints';
import { RaceWeekend } from '@/types/race';
import { DriverResult, PitStop, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding, Team } from '@/types/standing';
import { parseJsonField } from '@/utils/form';
import { isQualifyingSession } from '@/utils/gridVsRace';

export interface TeamCompareRound {
    round: number;
    meetingKey: number;
    country: string;
    aPoints: number;
    bPoints: number;
    aCumulative: number;
    bCumulative: number;
    aQualiGap: number | null;
    bQualiGap: number | null;
    aPit: number | null;
    bPit: number | null;
    aDrivers: DriverContribution[];
    bDrivers: DriverContribution[];
}

export interface TeamCompareSummary {
    points: [number, number];
    wins: [number, number];
    podiums: [number, number];
    dnfs: [number, number];
    avgQualiGap: [number | null, number | null];
    medianPit: [number | null, number | null];
    pitRank: [number | null, number | null];
    pointsRoundsWon: [number, number];
    roundsCompared: number;
}

export interface ConstructorComparisonResult {
    teamA: Team;
    teamB: Team;
    profileA: ConstructorProfile;
    profileB: ConstructorProfile;
    rounds: TeamCompareRound[];
    summary: TeamCompareSummary;
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Average gap to pole in seconds per team, per qualifying session.
function qualiGapsByMeeting(
    rows: SupabaseRaceResultRow[],
    drivers: DriverStanding[]
): Map<number, Map<string, number>> {
    const teamByDriver = new Map<number, string>(
        drivers.map((d): [number, string] => [d.driverNumber, d.teamName])
    );
    const out = new Map<number, Map<string, number>>();

    for (const row of rows) {
        if (!isQualifyingSession(row.session_name)) continue;

        const times = parseJsonField<DriverResult>(row.classification_json).flatMap((r) => {
            const time = bestTime(r);
            return time != null ? [{ driverNumber: r.driverNumber, time }] : [];
        });
        if (times.length < 2) continue;

        const pole = Math.min(...times.map((t) => t.time));
        const gaps = new Map<string, number[]>();
        for (const { driverNumber, time } of times) {
            const team = teamByDriver.get(driverNumber);
            if (!team) continue;
            const list = gaps.get(team) ?? [];
            list.push(time - pole);
            gaps.set(team, list);
        }

        const perTeam = new Map<string, number>();
        for (const [team, list] of gaps) perTeam.set(team, mean(list));
        out.set(row.meeting_key, perTeam);
    }

    return out;
}

// Pit lane time is used for every stop: stationary time is missing for later races.
function laneTimesByTeam(
    rows: SupabaseRaceResultRow[],
    drivers: DriverStanding[]
): Map<string, Map<number, number[]>> {
    const teamByDriver = new Map<number, string>(
        drivers.map((d): [number, string] => [d.driverNumber, d.teamName])
    );
    const out = new Map<string, Map<number, number[]>>();

    for (const row of rows) {
        if (row.session_name !== 'Race') continue;

        for (const pit of parseJsonField<PitStop>(row.pit_stops_json)) {
            const team = teamByDriver.get(pit.driver_number);
            const lane = pit.lane_duration;
            if (!team || lane == null || !(lane > 0)) continue;

            const byMeeting = out.get(team) ?? new Map<number, number[]>();
            const list = byMeeting.get(row.meeting_key) ?? [];
            list.push(lane);
            byMeeting.set(row.meeting_key, list);
            out.set(team, byMeeting);
        }
    }

    return out;
}

function teamLaneMedian(byMeeting: Map<number, number[]> | undefined): number | null {
    if (!byMeeting) return null;
    const all = [...byMeeting.values()].flat();
    return all.length ? median(all) : null;
}

function avg(values: (number | null)[]): number | null {
    const present = values.filter((v): v is number => v !== null);
    return present.length ? mean(present) : null;
}

export function buildConstructorComparison(
    teamA: Team,
    teamB: Team,
    drivers: DriverStanding[],
    raceRows: SupabaseRaceResultRow[],
    weekends: RaceWeekend[]
): ConstructorComparisonResult {
    const profileA = buildConstructorProfile(teamA, drivers, raceRows, weekends);
    const profileB = buildConstructorProfile(teamB, drivers, raceRows, weekends);
    const quali = qualiGapsByMeeting(raceRows, drivers);

    const resultsA = new Map(profileA.seasonResults.map((r) => [r.meetingKey, r]));
    const resultsB = new Map(profileB.seasonResults.map((r) => [r.meetingKey, r]));

    const lanes = laneTimesByTeam(raceRows, drivers);
    const laneA = lanes.get(teamA.teamName);
    const laneB = lanes.get(teamB.teamName);
    const pitRanking = [...lanes.entries()]
        .map(([team, byMeeting]) => ({ team, median: teamLaneMedian(byMeeting) ?? Infinity }))
        .sort((a, b) => a.median - b.median)
        .map((r) => r.team);
    const rankOf = (team: string) => {
        const i = pitRanking.indexOf(team);
        return i >= 0 ? i + 1 : null;
    };

    const rounds: TeamCompareRound[] = [];
    let round = 0;
    let aCumulative = 0;
    let bCumulative = 0;
    let aRoundsWon = 0;
    let bRoundsWon = 0;

    for (const meetingKey of getChronologicalMeetingOrder(weekends)) {
        const a = resultsA.get(meetingKey);
        const b = resultsB.get(meetingKey);
        if (!a && !b) continue;

        round++;
        const aPoints = a?.teamPoints ?? 0;
        const bPoints = b?.teamPoints ?? 0;
        aCumulative += aPoints;
        bCumulative += bPoints;
        if (aPoints > bPoints) aRoundsWon++;
        else if (bPoints > aPoints) bRoundsWon++;

        const gaps = quali.get(meetingKey);
        const aLane = laneA?.get(meetingKey);
        const bLane = laneB?.get(meetingKey);

        rounds.push({
            round,
            meetingKey,
            country: a?.country ?? b?.country ?? '',
            aPoints,
            bPoints,
            aCumulative,
            bCumulative,
            aQualiGap: gaps?.get(teamA.teamName) ?? null,
            bQualiGap: gaps?.get(teamB.teamName) ?? null,
            aPit: aLane?.length ? median(aLane) : null,
            bPit: bLane?.length ? median(bLane) : null,
            aDrivers: a?.driverBreakdown ?? [],
            bDrivers: b?.driverBreakdown ?? [],
        });
    }

    return {
        teamA,
        teamB,
        profileA,
        profileB,
        rounds,
        summary: {
            points: [aCumulative, bCumulative],
            wins: [profileA.stats.wins, profileB.stats.wins],
            podiums: [profileA.stats.podiums, profileB.stats.podiums],
            dnfs: [profileA.stats.dnfCount, profileB.stats.dnfCount],
            avgQualiGap: [avg(rounds.map((r) => r.aQualiGap)), avg(rounds.map((r) => r.bQualiGap))],
            medianPit: [teamLaneMedian(laneA), teamLaneMedian(laneB)],
            pitRank: [rankOf(teamA.teamName), rankOf(teamB.teamName)],
            pointsRoundsWon: [aRoundsWon, bRoundsWon],
            roundsCompared: rounds.length,
        },
    };
}
