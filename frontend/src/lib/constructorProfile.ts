import { parseJsonField } from '@/utils/form';
import {
    pointsFor,
    groupByMeeting,
    getChronologicalMeetingOrder,
    isSprintSession,
} from '@/lib/racePoints';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding, Team } from '@/types/standing';
import { RaceWeekend } from '@/types/race';

export interface DriverContribution {
    driverNumber: number;
    driverName: string;
    position: number | null;
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
    sprintPosition: number | null;
    racePoints: number;
    sprintPoints: number;
    points: number;
    cumulativePoints: number;
}

export interface ConstructorRoundResult {
    round: number;
    meetingKey: number;
    country: string;
    circuit: string;
    teamPoints: number;
    cumulativePoints: number;
    driverBreakdown: DriverContribution[];
}

export interface ConstructorStats {
    wins: number;
    podiums: number;
    dnfCount: number;
    bestFinish: number | null;
}

export interface DriverPointsContribution {
    driverNumber: number;
    driverName: string;
    totalPoints: number;
}

export interface ConstructorProfile {
    teamName: string;
    teamColor: string;
    currentPosition: number;
    currentPoints: number;
    drivers: DriverStanding[];
    seasonResults: ConstructorRoundResult[];
    stats: ConstructorStats;
    driverContributions: DriverPointsContribution[];
}

function buildSeasonResults(
    teamDrivers: DriverStanding[],
    byMeeting: Map<number, SupabaseRaceResultRow[]>,
    meetingOrder: number[],
    circuitByMeeting: Map<number, string>
): ConstructorRoundResult[] {
    const results: ConstructorRoundResult[] = [];
    const cumulativeByDriver = new Map<number, number>();
    let round = 0;
    let cumulative = 0;

    for (const meetingKey of meetingOrder) {
        const sessions = byMeeting.get(meetingKey);
        if (!sessions) continue;

        const raceSession = sessions.find((r) => r.session_name === 'Race');
        if (!raceSession) continue;

        const raceClassification = parseJsonField<DriverResult>(raceSession.classification_json);

        const sprintSession = sessions.find((r) => isSprintSession(r.session_name));
        const sprintClassification = sprintSession
            ? parseJsonField<DriverResult>(sprintSession.classification_json)
            : [];

        const breakdown: DriverContribution[] = [];
        let teamPoints = 0;

        for (const driver of teamDrivers) {
            const raceEntry = raceClassification.find(
                (c) => c.driverNumber === driver.driverNumber
            );
            if (!raceEntry) continue;

            const racePoints = pointsFor(raceEntry, false);

            const sprintEntry = sprintClassification.find(
                (c) => c.driverNumber === driver.driverNumber
            );
            const sprintPosition = sprintEntry ? sprintEntry.position : null;
            const sprintPoints = sprintEntry ? pointsFor(sprintEntry, true) : 0;

            const driverPoints = racePoints + sprintPoints;
            const driverCumulative =
                (cumulativeByDriver.get(driver.driverNumber) ?? 0) + driverPoints;
            cumulativeByDriver.set(driver.driverNumber, driverCumulative);

            teamPoints += driverPoints;
            breakdown.push({
                driverNumber: driver.driverNumber,
                driverName: driver.driverName,
                position: raceEntry.position,
                dnf: raceEntry.dnf,
                dns: raceEntry.dns,
                dsq: raceEntry.dsq,
                sprintPosition,
                racePoints,
                sprintPoints,
                points: driverPoints,
                cumulativePoints: driverCumulative,
            });
        }

        if (breakdown.length === 0) continue;

        round++;
        cumulative += teamPoints;

        results.push({
            round,
            meetingKey,
            country: raceSession.country,
            circuit: circuitByMeeting.get(meetingKey) ?? '',
            teamPoints,
            cumulativePoints: cumulative,
            driverBreakdown: breakdown,
        });
    }

    return results;
}

function buildConstructorStats(seasonResults: ConstructorRoundResult[]): ConstructorStats {
    let wins = 0;
    let podiums = 0;
    let dnfCount = 0;
    let bestFinish: number | null = null;

    for (const round of seasonResults) {
        for (const d of round.driverBreakdown) {
            if (d.dnf || d.dns || d.dsq) {
                dnfCount++;
                continue;
            }
            if (d.position === 1) wins++;
            if (d.position !== null && d.position <= 3) podiums++;
            if (d.position !== null && (bestFinish === null || d.position < bestFinish)) {
                bestFinish = d.position;
            }
        }
    }

    return { wins, podiums, dnfCount, bestFinish };
}

function buildDriverContributions(
    teamDrivers: DriverStanding[],
    seasonResults: ConstructorRoundResult[]
): DriverPointsContribution[] {
    return teamDrivers.map((driver) => {
        const totalPoints = seasonResults.reduce((sum, round) => {
            const entry = round.driverBreakdown.find((d) => d.driverNumber === driver.driverNumber);
            return sum + (entry?.points ?? 0);
        }, 0);

        return {
            driverNumber: driver.driverNumber,
            driverName: driver.driverName,
            totalPoints,
        };
    });
}

export function buildConstructorProfile(
    team: Team,
    allDrivers: DriverStanding[],
    raceRows: SupabaseRaceResultRow[],
    weekends: RaceWeekend[]
): ConstructorProfile {
    const teamDrivers = allDrivers.filter((d) => d.teamName === team.teamName);
    const byMeeting = groupByMeeting(raceRows);
    const meetingOrder = getChronologicalMeetingOrder(weekends);
    const circuitByMeeting = new Map<number, string>(
        weekends.map((w): [number, string] => [w.meetingKey, w.circuit])
    );
    const seasonResults = buildSeasonResults(
        teamDrivers,
        byMeeting,
        meetingOrder,
        circuitByMeeting
    );

    return {
        teamName: team.teamName,
        teamColor: team.teamColor,
        currentPosition: team.position,
        currentPoints: team.points,
        drivers: teamDrivers,
        seasonResults,
        stats: buildConstructorStats(seasonResults),
        driverContributions: buildDriverContributions(teamDrivers, seasonResults),
    };
}
