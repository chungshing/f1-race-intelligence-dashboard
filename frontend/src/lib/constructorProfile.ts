import { getChronologicalMeetingOrder, groupByMeeting, pointsFor } from '@/lib/racePoints';
import { RaceWeekend } from '@/types/race';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding, Team } from '@/types/standing';
import { parseJsonField } from '@/utils/form';

export interface DriverContribution {
    driverNumber: number;
    driverName: string;
    points: number;
    position: number | null;
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
}

export interface ConstructorRoundResult {
    round: number;
    meetingKey: number;
    country: string;
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
    stats: ConstructorStats;
    driverContributions: DriverPointsContribution[];
    seasonResults: ConstructorRoundResult[];
}

function buildSeasonResults(
    teamDrivers: DriverStanding[],
    byMeeting: Map<number, SupabaseRaceResultRow[]>,
    meetingOrder: number[]
): ConstructorRoundResult[] {
    const results: ConstructorRoundResult[] = [];
    let round = 0;
    let cumulative = 0;

    for (const meetingKey of meetingOrder) {
        const sessions = byMeeting.get(meetingKey);
        if (!sessions) continue;

        const raceSession = sessions.find((r) => r.session_name === 'Race');
        if (!raceSession) continue;

        const raceClassification = parseJsonField<DriverResult>(raceSession.classification_json);

        const breakdown: DriverContribution[] = [];
        let teamPoints = 0;
        let anyDriverPresent = false;

        for (const driver of teamDrivers) {
            const raceEntry = raceClassification.find(
                (c) => c.driverNumber === driver.driverNumber
            );
            if (!raceEntry) continue;

            anyDriverPresent = true;
            let driverPoints = 0;
            for (const session of sessions) {
                const isSprint = session.session_name === 'Sprint';
                const classification = parseJsonField<DriverResult>(session.classification_json);
                const entry = classification.find((c) => c.driverNumber === driver.driverNumber);
                if (entry) driverPoints += pointsFor(entry, isSprint);
            }

            teamPoints += driverPoints;
            breakdown.push({
                driverNumber: driver.driverNumber,
                driverName: driver.driverName,
                points: driverPoints,
                position: raceEntry.position,
                dnf: raceEntry.dnf,
                dns: raceEntry.dns,
                dsq: raceEntry.dsq,
            });
        }

        if (!anyDriverPresent) continue;

        round++;
        cumulative += teamPoints;

        results.push({
            round,
            meetingKey,
            country: raceSession.country,
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
    const seasonResults = buildSeasonResults(teamDrivers, byMeeting, meetingOrder);

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
