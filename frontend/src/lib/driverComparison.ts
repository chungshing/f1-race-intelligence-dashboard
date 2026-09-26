import { parseJsonField } from '@/utils/form';
import { groupByMeeting, getChronologicalMeetingOrder, pointsFor } from '@/lib/racePoints';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { RaceWeekend } from '@/types/race';

export interface ComparisonRound {
    round: number;
    meetingKey: number;
    country: string;
    driverAPosition: number | null;
    driverAOut: boolean;
    driverBPosition: number | null;
    driverBOut: boolean;
    driverAPoints: number;
    driverBPoints: number;
}

export interface DriverComparisonResult {
    driverA: DriverStanding;
    driverB: DriverStanding;
    rounds: ComparisonRound[];
    driverAWins: number;
    driverBWins: number;
    driverATotalPoints: number;
    driverBTotalPoints: number;
    roundsCompared: number;
}

export function buildDriverComparison(
    driverA: DriverStanding,
    driverB: DriverStanding,
    raceRows: SupabaseRaceResultRow[],
    weekends: RaceWeekend[]
): DriverComparisonResult {
    const byMeeting = groupByMeeting(raceRows);
    const meetingOrder = getChronologicalMeetingOrder(weekends);

    const rounds: ComparisonRound[] = [];
    let driverAWins = 0;
    let driverBWins = 0;
    let driverATotalPoints = 0;
    let driverBTotalPoints = 0;
    let round = 0;

    for (const meetingKey of meetingOrder) {
        const sessions = byMeeting.get(meetingKey);
        if (!sessions) continue;

        const raceSession = sessions.find((r) => r.session_name === 'Race');
        if (!raceSession) continue;

        const raceClassification = parseJsonField<DriverResult>(raceSession.classification_json);
        const aEntry = raceClassification.find((c) => c.driverNumber === driverA.driverNumber);
        const bEntry = raceClassification.find((c) => c.driverNumber === driverB.driverNumber);

        if (!aEntry || !bEntry) continue;

        round++;

        let aRoundPoints = 0;
        let bRoundPoints = 0;
        for (const session of sessions) {
            const isSprint = session.session_name === 'Sprint';
            const classification = parseJsonField<DriverResult>(session.classification_json);
            const aSessionEntry = classification.find(
                (c) => c.driverNumber === driverA.driverNumber
            );
            const bSessionEntry = classification.find(
                (c) => c.driverNumber === driverB.driverNumber
            );
            if (aSessionEntry) aRoundPoints += pointsFor(aSessionEntry, isSprint);
            if (bSessionEntry) bRoundPoints += pointsFor(bSessionEntry, isSprint);
        }

        driverATotalPoints += aRoundPoints;
        driverBTotalPoints += bRoundPoints;

        const aOut = aEntry.dnf || aEntry.dns || aEntry.dsq;
        const bOut = bEntry.dnf || bEntry.dns || bEntry.dsq;

        if (!aOut && !bOut) {
            if (aEntry.position! < bEntry.position!) driverAWins++;
            else if (bEntry.position! < aEntry.position!) driverBWins++;
        } else if (aOut && !bOut) {
            driverBWins++;
        } else if (bOut && !aOut) {
            driverAWins++;
        }

        rounds.push({
            round,
            meetingKey,
            country: raceSession.country,
            driverAPosition: aEntry.position,
            driverAOut: aOut,
            driverBPosition: bEntry.position,
            driverBOut: bOut,
            driverAPoints: aRoundPoints,
            driverBPoints: bRoundPoints,
        });
    }

    return {
        driverA,
        driverB,
        rounds,
        driverAWins,
        driverBWins,
        driverATotalPoints,
        driverBTotalPoints,
        roundsCompared: rounds.length,
    };
}
