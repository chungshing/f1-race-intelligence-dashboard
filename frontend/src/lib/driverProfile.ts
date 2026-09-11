import { groupByMeeting, pointsFor } from '@/lib/racePoints';
import { DriverResult, Stint, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';

export interface RoundResult {
    round: number;
    meetingKey: number;
    country: string;
    position: number | null;
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
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
    byMeeting: Map<number, SupabaseRaceResultRow[]>
): RoundResult[] {
    const results: RoundResult[] = [];
    let round = 0;
    let cumulative = 0;

    for (const [meetingKey, sessions] of byMeeting) {
        const raceSession = sessions.find((r) => r.session_name === 'Race');
        if (!raceSession) continue;

        const raceClassification = parseJsonField<DriverResult>(raceSession.classification_json);
        const raceEntry = raceClassification.find((c) => c.driverNumber === driverNumber);
        if (!raceEntry) continue;

        let roundPoints = 0;
        for (const session of sessions) {
            const isSprint = session.session_name === 'Sprint';
            const classification = parseJsonField<DriverResult>(session.classification_json);
            const entry = classification.find((c) => c.driverNumber === driverNumber);
            if (entry) roundPoints += pointsFor(entry, isSprint);
        }

        round++;
        cumulative += roundPoints;

        results.push({
            round,
            meetingKey,
            country: raceSession.country,
            position: raceEntry.position,
            dnf: raceEntry.dnf,
            dns: raceEntry.dns,
            dsq: raceEntry.dsq,
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
    raceRows: SupabaseRaceResultRow[]
): DriverProfile {
    const byMeeting = groupByMeeting(raceRows);
    const scoringRows = raceRows.filter(
        (r) => r.session_name === 'Race' || r.session_name === 'Sprint'
    );
    const seasonResults = buildSeasonResults(driverNumber, byMeeting);

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
