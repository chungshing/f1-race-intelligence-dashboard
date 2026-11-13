import {
    buildConstructorProfile,
    ConstructorProfile,
    DriverContribution,
} from '@/lib/constructorProfile';
import { bestTime } from '@/lib/qualiPace';
import { getChronologicalMeetingOrder } from '@/lib/racePoints';
import { RaceWeekend } from '@/types/race';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
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
    usingLaneDuration: boolean;
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

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
            list.push(((time - pole) / pole) * 100);
            gaps.set(team, list);
        }

        const perTeam = new Map<string, number>();
        for (const [team, list] of gaps) perTeam.set(team, mean(list));
        out.set(row.meeting_key, perTeam);
    }

    return out;
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
    const pitA = new Map(profileA.pitStops.rounds.map((r) => [r.meetingKey, r.median]));
    const pitB = new Map(profileB.pitStops.rounds.map((r) => [r.meetingKey, r.median]));

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
            aPit: pitA.get(meetingKey) ?? null,
            bPit: pitB.get(meetingKey) ?? null,
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
        usingLaneDuration: profileA.pitStops.usingLaneDuration,
        summary: {
            points: [aCumulative, bCumulative],
            wins: [profileA.stats.wins, profileB.stats.wins],
            podiums: [profileA.stats.podiums, profileB.stats.podiums],
            dnfs: [profileA.stats.dnfCount, profileB.stats.dnfCount],
            avgQualiGap: [avg(rounds.map((r) => r.aQualiGap)), avg(rounds.map((r) => r.bQualiGap))],
            medianPit: [profileA.pitStops.medianStop, profileB.pitStops.medianStop],
            pitRank: [profileA.pitStops.rank, profileB.pitStops.rank],
            pointsRoundsWon: [aRoundsWon, bRoundsWon],
            roundsCompared: rounds.length,
        },
    };
}
