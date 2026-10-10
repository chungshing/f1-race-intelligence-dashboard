import {
    getChronologicalMeetingOrder,
    groupByMeeting,
    isSprintSession,
    pointsFor,
} from '@/lib/racePoints';
import { RaceWeekend } from '@/types/race';
import { DriverResult, Stint, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';

export interface RoundResult {
    round: number;
    meetingKey: number;
    country: string;
    circuit: string;
    position: number | null;
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
    sprintPosition: number | null;
    sprintPoints: number;
    racePoints: number;
    roundPoints: number;
    cumulativePoints: number;
}

export interface TeammateH2H {
    teammateDriverNumber: number;
    teammateName: string;
    driverWins: number;
    teammateWins: number;
    roundsCompared: number;
}

export interface TyreCompoundUsage {
    compound: string;
    stintCount: number;
    averageStintLength: number;
}

export interface DriverStats {
    wins: number;
    podiums: number;
    dnfCount: number;
    bestFinish: number | null;
}

export interface DriverProfile {
    driverNumber: number;
    driverName: string;
    teamName: string;
    teamColor: string;
    headshotUrl: string | null;
    currentPosition: number;
    currentPoints: number;
    seasonResults: RoundResult[];
    teammateH2H: TeammateH2H[];
    tyreTendencies: TyreCompoundUsage[];
    stats: DriverStats;
}

function buildSeasonResults(
    driverNumber: number,
    byMeeting: Map<number, SupabaseRaceResultRow[]>,
    meetingOrder: number[],
    circuitByMeeting: Map<number, string>
): RoundResult[] {
    const results: RoundResult[] = [];
    let round = 0;
    let cumulative = 0;

    for (const meetingKey of meetingOrder) {
        const sessions = byMeeting.get(meetingKey);
        if (!sessions) continue;

        const raceSession = sessions.find((r) => r.session_name === 'Race');
        if (!raceSession) continue;

        const raceClassification = parseJsonField<DriverResult>(raceSession.classification_json);
        const raceEntry = raceClassification.find((c) => c.driverNumber === driverNumber);
        if (!raceEntry) continue;

        const racePoints = pointsFor(raceEntry, false);

        const sprintSession = sessions.find((r) => isSprintSession(r.session_name));
        let sprintPosition: number | null = null;
        let sprintPoints = 0;

        if (sprintSession) {
            const sprintClassification = parseJsonField<DriverResult>(
                sprintSession.classification_json
            );
            const sprintEntry = sprintClassification.find((c) => c.driverNumber === driverNumber);
            if (sprintEntry) {
                sprintPosition = sprintEntry.position;
                sprintPoints = pointsFor(sprintEntry, true);
            }
        }

        const roundPoints = racePoints + sprintPoints;

        round++;
        cumulative += roundPoints;

        results.push({
            round,
            meetingKey,
            country: raceSession.country,
            circuit: circuitByMeeting.get(meetingKey) ?? '',
            position: raceEntry.position,
            dnf: raceEntry.dnf,
            dns: raceEntry.dns,
            dsq: raceEntry.dsq,
            sprintPosition,
            sprintPoints,
            racePoints,
            roundPoints,
            cumulativePoints: cumulative,
        });
    }

    return results;
}

function buildTeammateH2H(
    driverNumber: number,
    teamName: string,
    allDrivers: DriverStanding[],
    byMeeting: Map<number, SupabaseRaceResultRow[]>
): TeammateH2H[] {
    const teammates = allDrivers.filter(
        (d) => d.teamName === teamName && d.driverNumber !== driverNumber
    );

    return teammates.map((teammate) => {
        let driverWins = 0;
        let teammateWins = 0;
        let compared = 0;

        for (const sessions of byMeeting.values()) {
            const raceSession = sessions.find((r) => r.session_name === 'Race');
            if (!raceSession) continue;

            const classification = parseJsonField<DriverResult>(raceSession.classification_json);
            const driverEntry = classification.find((c) => c.driverNumber === driverNumber);
            const teammateEntry = classification.find(
                (c) => c.driverNumber === teammate.driverNumber
            );
            if (!driverEntry || !teammateEntry) continue;

            compared++;
            const driverOut = driverEntry.dnf || driverEntry.dns || driverEntry.dsq;
            const teammateOut = teammateEntry.dnf || teammateEntry.dns || teammateEntry.dsq;

            if (driverOut && teammateOut) continue;
            if (driverOut) teammateWins++;
            else if (teammateOut) driverWins++;
            else if (driverEntry.position! < teammateEntry.position!) driverWins++;
            else if (teammateEntry.position! < driverEntry.position!) teammateWins++;
        }

        return {
            teammateDriverNumber: teammate.driverNumber,
            teammateName: teammate.driverName,
            driverWins,
            teammateWins,
            roundsCompared: compared,
        };
    });
}

function buildTyreTendencies(
    driverNumber: number,
    rows: SupabaseRaceResultRow[]
): TyreCompoundUsage[] {
    const lengthsByCompound = new Map<string, number[]>();

    for (const row of rows) {
        const stints = parseJsonField<Stint>(row.stints_json);
        for (const stint of stints) {
            if (stint.driver_number !== driverNumber || !stint.compound) continue;
            const length = stint.lap_end - stint.lap_start + 1;
            const list = lengthsByCompound.get(stint.compound) ?? [];
            list.push(length);
            lengthsByCompound.set(stint.compound, list);
        }
    }

    return Array.from(lengthsByCompound.entries()).map(([compound, lengths]) => ({
        compound,
        stintCount: lengths.length,
        averageStintLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    }));
}

function buildDriverStats(seasonResults: RoundResult[]): DriverStats {
    let wins = 0;
    let podiums = 0;
    let dnfCount = 0;
    let bestFinish: number | null = null;

    for (const r of seasonResults) {
        if (r.dnf || r.dns || r.dsq) {
            dnfCount++;
            continue;
        }
        if (r.position === 1) wins++;
        if (r.position !== null && r.position <= 3) podiums++;
        if (r.position !== null && (bestFinish === null || r.position < bestFinish)) {
            bestFinish = r.position;
        }
    }

    return { wins, podiums, dnfCount, bestFinish };
}

export function buildDriverProfile(
    driverNumber: number,
    standing: DriverStanding,
    allDrivers: DriverStanding[],
    raceRows: SupabaseRaceResultRow[],
    weekends: RaceWeekend[]
): DriverProfile {
    const byMeeting = groupByMeeting(raceRows);
    const meetingOrder = getChronologicalMeetingOrder(weekends);
    const circuitByMeeting = new Map<number, string>(
        weekends.map((w): [number, string] => [w.meetingKey, w.circuit])
    );
    const scoringRows = raceRows.filter(
        (r) => r.session_name === 'Race' || isSprintSession(r.session_name)
    );
    const seasonResults = buildSeasonResults(
        driverNumber,
        byMeeting,
        meetingOrder,
        circuitByMeeting
    );

    return {
        driverNumber,
        driverName: standing.driverName,
        teamName: standing.teamName,
        teamColor: standing.teamColor,
        headshotUrl: standing.headshotUrl,
        currentPosition: standing.position,
        currentPoints: standing.points,
        seasonResults,
        teammateH2H: buildTeammateH2H(driverNumber, standing.teamName, allDrivers, byMeeting),
        tyreTendencies: buildTyreTendencies(driverNumber, scoringRows),
        stats: buildDriverStats(seasonResults),
    };
}
