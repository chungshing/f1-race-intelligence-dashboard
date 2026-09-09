import { DriverResult, Stint, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

function pointsFor(result: DriverResult, isSprint: boolean): number {
    if (result.dnf || result.dns || result.dsq) return 0;
    if (!result.position) return 0;

    const table = isSprint ? SPRINT_POINTS : RACE_POINTS;
    return table[result.position - 1] ?? 0;
}

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
}

function groupByMeeting(rows: SupabaseRaceResultRow[]) {
    const scoring = rows
        .filter((r) => r.session_name === 'Race' || r.session_name === 'Sprint')
        .sort((a, b) => a.meeting_key - b.meeting_key);

    const byMeeting = new Map<number, SupabaseRaceResultRow[]>();
    for (const row of scoring) {
        const list = byMeeting.get(row.meeting_key) ?? [];
        list.push(row);
        byMeeting.set(row.meeting_key, list);
    }
    return byMeeting;
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

export function buildDriverProfile(
    driverNumber: number,
    standing: DriverStanding,
    allDrivers: DriverStanding[],
    raceRows: SupabaseRaceResultRow[]
): DriverProfile {
    const byMeeting = groupByMeeting(raceRows);

    return {
        driverNumber,
        driverName: standing.driverName,
        teamName: standing.teamName,
        teamColor: standing.teamColor,
        headshotUrl: standing.headshotUrl,
        currentPosition: standing.position,
        currentPoints: standing.points,
        seasonResults: buildSeasonResults(driverNumber, byMeeting),
        teammateH2H: buildTeammateH2H(driverNumber, standing.teamName, allDrivers, byMeeting),
        tyreTendencies: buildTyreTendencies(driverNumber, raceRows),
    };
}
