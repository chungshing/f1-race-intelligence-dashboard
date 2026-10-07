import { parseJsonField } from '@/utils/form';
import {
    groupByMeeting,
    getChronologicalMeetingOrder,
    pointsFor,
    isSprintSession,
} from '@/lib/racePoints';
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
    driverASprintPosition: number | null;
    driverBSprintPosition: number | null;
    driverASprintOut: boolean;
    driverBSprintOut: boolean;
    driverAPoints: number;
    driverBPoints: number;
    driverACumulative: number;
    driverBCumulative: number;
    pointsGap: number;
    pointsLeader: 'A' | 'B' | null;
}

export interface DriverComparisonResult {
    driverA: DriverStanding;
    driverB: DriverStanding;
    rounds: ComparisonRound[];
    driverAWins: number;
    driverBWins: number;
    driverASprintWins: number;
    driverBSprintWins: number;
    sprintRoundsCompared: number;
    driverATotalPoints: number;
    driverBTotalPoints: number;
    roundsCompared: number;
    hasAnySprintRound: boolean;
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
    let driverASprintWins = 0;
    let driverBSprintWins = 0;
    let sprintRoundsCompared = 0;
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
        let aSprintPosition: number | null = null;
        let bSprintPosition: number | null = null;
        let aSprintOut = false;
        let bSprintOut = false;

        for (const session of sessions) {
            const isSprint = isSprintSession(session.session_name);
            const classification = parseJsonField<DriverResult>(session.classification_json);
            const aSessionEntry = classification.find(
                (c) => c.driverNumber === driverA.driverNumber
            );
            const bSessionEntry = classification.find(
                (c) => c.driverNumber === driverB.driverNumber
            );

            if (aSessionEntry) {
                aRoundPoints += pointsFor(aSessionEntry, isSprint);
                if (isSprint) {
                    aSprintPosition = aSessionEntry.position;
                    aSprintOut = aSessionEntry.dnf || aSessionEntry.dns || aSessionEntry.dsq;
                }
            }
            if (bSessionEntry) {
                bRoundPoints += pointsFor(bSessionEntry, isSprint);
                if (isSprint) {
                    bSprintPosition = bSessionEntry.position;
                    bSprintOut = bSessionEntry.dnf || bSessionEntry.dns || bSessionEntry.dsq;
                }
            }
        }

        driverATotalPoints += aRoundPoints;
        driverBTotalPoints += bRoundPoints;

        // Race H2H — only counts a win when both drivers were actually
        // classified with a real finishing position. A DNF'd driver never
        // "beats" anyone, regardless of what position value OpenF1 stored.
        const aOut = aEntry.dnf || aEntry.dns || aEntry.dsq;
        const bOut = bEntry.dnf || bEntry.dns || bEntry.dsq;
        const aHasPosition = !aOut && aEntry.position !== null;
        const bHasPosition = !bOut && bEntry.position !== null;

        if (aHasPosition && bHasPosition) {
            if (aEntry.position! < bEntry.position!) driverAWins++;
            else if (bEntry.position! < aEntry.position!) driverBWins++;
        } else if (aHasPosition && !bHasPosition) {
            driverAWins++;
        } else if (bHasPosition && !aHasPosition) {
            driverBWins++;
        }
        // If neither has a valid position (both out), no win is awarded to either side.

        // Sprint H2H — tracked as its own sub-bracket, same logic.
        if (aSprintPosition !== null || bSprintPosition !== null) {
            sprintRoundsCompared++;

            const aSprintHasPosition = !aSprintOut && aSprintPosition !== null;
            const bSprintHasPosition = !bSprintOut && bSprintPosition !== null;

            if (aSprintHasPosition && bSprintHasPosition) {
                if (aSprintPosition! < bSprintPosition!) driverASprintWins++;
                else if (bSprintPosition! < aSprintPosition!) driverBSprintWins++;
            } else if (aSprintHasPosition && !bSprintHasPosition) {
                driverASprintWins++;
            } else if (bSprintHasPosition && !aSprintHasPosition) {
                driverBSprintWins++;
            }
        }

        const pointsDiff = aRoundPoints - bRoundPoints;
        const pointsGap = Math.abs(pointsDiff);
        const pointsLeader: 'A' | 'B' | null = pointsDiff > 0 ? 'A' : pointsDiff < 0 ? 'B' : null;

        rounds.push({
            round,
            meetingKey,
            country: raceSession.country,
            driverAPosition: aEntry.position,
            driverAOut: aOut,
            driverBPosition: bEntry.position,
            driverBOut: bOut,
            driverASprintPosition: aSprintPosition,
            driverBSprintPosition: bSprintPosition,
            driverASprintOut: aSprintOut,
            driverBSprintOut: bSprintOut,
            driverAPoints: aRoundPoints,
            driverBPoints: bRoundPoints,
            driverACumulative: driverATotalPoints,
            driverBCumulative: driverBTotalPoints,
            pointsGap,
            pointsLeader,
        });
    }

    return {
        driverA,
        driverB,
        rounds,
        driverAWins,
        driverBWins,
        driverASprintWins,
        driverBSprintWins,
        sprintRoundsCompared,
        driverATotalPoints,
        driverBTotalPoints,
        roundsCompared: rounds.length,
        hasAnySprintRound: rounds.some(
            (r) => r.driverASprintPosition !== null || r.driverBSprintPosition !== null
        ),
    };
}
