import { bestTime } from '@/lib/qualiPace';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';
import { isGrandPrixSession, isQualifyingSession } from '@/utils/gridVsRace';

export interface TeammateDriver {
    driverNumber: number;
    name: string;
    points: number;
}

export interface TeammatePair {
    key: string;
    teamName: string;
    teamColor: string;
    a: TeammateDriver;
    b: TeammateDriver;
    qualiA: number;
    qualiB: number;
    raceA: number;
    raceB: number;
    // Median of (B time - A time) / A time. Positive means A was faster.
    medianGapPct: number | null;
}

const isClassified = (r: DriverResult | undefined) =>
    !!r && r.position != null && !r.dnf && !r.dns && !r.dsq;

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function buildTeammateBattles(
    rows: SupabaseRaceResultRow[],
    drivers: DriverStanding[]
): TeammatePair[] {
    const byMeeting = new Map<
        number,
        { quali?: SupabaseRaceResultRow; race?: SupabaseRaceResultRow }
    >();
    for (const row of rows) {
        const entry = byMeeting.get(row.meeting_key) ?? {};
        if (isQualifyingSession(row.session_name)) entry.quali = row;
        else if (isGrandPrixSession(row.session_name)) entry.race = row;
        byMeeting.set(row.meeting_key, entry);
    }

    // Highest points first, so "A" in every pair is the driver with more points.
    const membersByTeam = new Map<string, DriverStanding[]>();
    for (const driver of [...drivers].sort((x, y) => y.points - x.points)) {
        const list = membersByTeam.get(driver.teamName) ?? [];
        list.push(driver);
        membersByTeam.set(driver.teamName, list);
    }

    const pairs = new Map<string, TeammatePair & { gaps: number[] }>();

    for (const { quali, race } of byMeeting.values()) {
        const qualiResults = quali ? parseJsonField<DriverResult>(quali.classification_json) : [];
        const raceResults = race ? parseJsonField<DriverResult>(race.classification_json) : [];

        for (const [teamName, members] of membersByTeam) {
            for (let i = 0; i < members.length; i++) {
                for (let j = i + 1; j < members.length; j++) {
                    const a = members[i];
                    const b = members[j];
                    const key = `${a.driverNumber}-${b.driverNumber}`;

                    const pair =
                        pairs.get(key) ??
                        ({
                            key,
                            teamName,
                            teamColor: a.teamColor,
                            a: {
                                driverNumber: a.driverNumber,
                                name: a.driverName,
                                points: a.points,
                            },
                            b: {
                                driverNumber: b.driverNumber,
                                name: b.driverName,
                                points: b.points,
                            },
                            qualiA: 0,
                            qualiB: 0,
                            raceA: 0,
                            raceB: 0,
                            medianGapPct: null,
                            gaps: [],
                        } satisfies TeammatePair & { gaps: number[] });
                    pairs.set(key, pair);

                    const qa = qualiResults.find((r) => r.driverNumber === a.driverNumber);
                    const qb = qualiResults.find((r) => r.driverNumber === b.driverNumber);
                    if (qa?.position != null && qb?.position != null) {
                        if (qa.position < qb.position) pair.qualiA++;
                        else if (qb.position < qa.position) pair.qualiB++;

                        const ta = bestTime(qa);
                        const tb = bestTime(qb);
                        if (ta != null && tb != null) pair.gaps.push(((tb - ta) / ta) * 100);
                    }

                    const ra = raceResults.find((r) => r.driverNumber === a.driverNumber);
                    const rb = raceResults.find((r) => r.driverNumber === b.driverNumber);
                    const aDone = isClassified(ra);
                    const bDone = isClassified(rb);
                    if (aDone && bDone) {
                        if ((ra!.position ?? 99) < (rb!.position ?? 99)) pair.raceA++;
                        else pair.raceB++;
                    } else if (aDone && rb && !rb.dns) {
                        pair.raceA++;
                    } else if (bDone && ra && !ra.dns) {
                        pair.raceB++;
                    }
                }
            }
        }
    }

    return [...pairs.values()]
        .filter((p) => p.qualiA + p.qualiB + p.raceA + p.raceB > 0)
        .map(({ gaps, ...pair }) => ({
            ...pair,
            medianGapPct: gaps.length > 0 ? median(gaps) : null,
        }))
        .sort((x, y) => y.a.points + y.b.points - (x.a.points + x.b.points));
}
