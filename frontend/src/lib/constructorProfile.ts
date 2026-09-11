import { groupByMeeting, pointsFor } from '@/lib/racePoints';
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

export interface ConstructorProfile {
    teamName: string;
    teamColor: string;
    currentPosition: number;
    currentPoints: number;
    drivers: DriverStanding[];
    seasonResults: ConstructorRoundResult[];
}

function buildSeasonResults(
    teamDrivers: DriverStanding[],
    byMeeting: Map<number, SupabaseRaceResultRow[]>
): ConstructorRoundResult[] {
    const results: ConstructorRoundResult[] = [];
    let round = 0;
    let cumulative = 0;

    for (const [meetingKey, sessions] of byMeeting) {
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

export function buildConstructorProfile(
    team: Team,
    allDrivers: DriverStanding[],
    raceRows: SupabaseRaceResultRow[]
): ConstructorProfile {
    const teamDrivers = allDrivers.filter((d) => d.teamName === team.teamName);
    const byMeeting = groupByMeeting(raceRows);

    return {
        teamName: team.teamName,
        teamColor: team.teamColor,
        currentPosition: team.position,
        currentPoints: team.points,
        drivers: teamDrivers,
        seasonResults: buildSeasonResults(teamDrivers, byMeeting),
    };
}
