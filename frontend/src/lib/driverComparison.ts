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

export type PositionStatus = 'DNF' | 'DNS' | 'DSQ';

export interface ComparisonRound {
    round: number;
    meetingKey: number;
    country: string;
    driverAPosition: number | null;
    driverAStatus: PositionStatus | null;
    driverBPosition: number | null;
    driverBStatus: PositionStatus | null;
    driverASprintPosition: number | null;
    driverASprintStatus: PositionStatus | null;
    driverBSprintPosition: number | null;
    driverBSprintStatus: PositionStatus | null;
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

function resolveStatus(entry: DriverResult): PositionStatus | null {
    if (entry.dsq) return 'DSQ';
    if (entry.dnf) return 'DNF';
    if (entry.dns) return 'DNS';
    return null;
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
        let aSprintStatus: PositionStatus | null = null;
        let bSprintStatus: PositionStatus | null = null;

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
                    aSprintStatus = resolveStatus(aSessionEntry);
                }
            }
            if (bSessionEntry) {
                bRoundPoints += pointsFor(bSessionEntry, isSprint);
                if (isSprint) {
                    bSprintPosition = bSessionEntry.position;
                    bSprintStatus = resolveStatus(bSessionEntry);
                }
            }
        }

        driverATotalPoints += aRoundPoints;
        driverBTotalPoints += bRoundPoints;

        const aStatus = resolveStatus(aEntry);
        const bStatus = resolveStatus(bEntry);

        // A win only counts when at least one driver has a real classified position.
        // DNF / DNS / DSQ / unclassified (null) never beat anyone.
        const aHasPosition = aStatus === null && aEntry.position !== null;
        const bHasPosition = bStatus === null && bEntry.position !== null;

        if (aHasPosition && bHasPosition) {
            if (aEntry.position! < bEntry.position!) driverAWins++;
            else if (bEntry.position! < aEntry.position!) driverBWins++;
        } else if (aHasPosition && !bHasPosition) {
            driverAWins++;
        } else if (bHasPosition && !aHasPosition) {
            driverBWins++;
        }

        if (
            aSprintPosition !== null ||
            bSprintPosition !== null ||
            aSprintStatus ||
            bSprintStatus
        ) {
            sprintRoundsCompared++;

            const aSprintHasPosition = aSprintStatus === null && aSprintPosition !== null;
            const bSprintHasPosition = bSprintStatus === null && bSprintPosition !== null;

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
            driverAStatus: aStatus,
            driverBPosition: bEntry.position,
            driverBStatus: bStatus,
            driverASprintPosition: aSprintPosition,
            driverASprintStatus: aSprintStatus,
            driverBSprintPosition: bSprintPosition,
            driverBSprintStatus: bSprintStatus,
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
            (r) =>
                r.driverASprintPosition !== null ||
                r.driverBSprintPosition !== null ||
                r.driverASprintStatus !== null ||
                r.driverBSprintStatus !== null
        ),
    };
}
