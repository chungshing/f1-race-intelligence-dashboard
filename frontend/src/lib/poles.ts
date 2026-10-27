import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';
import { isGrandPrixSession, isQualifyingSession } from '@/utils/gridVsRace';

export interface PoleStat {
    key: string;
    name: string;
    teamName: string;
    teamColor: string;
    poles: number;
    wins: number;
    winsFromPole: number;
    conversion: number | null;
}

export interface PoleSummary {
    drivers: PoleStat[];
    teams: PoleStat[];
    racesCompared: number;
    poleSitterWon: number;
}

interface Counts {
    poles: number;
    wins: number;
    winsFromPole: number;
}

function topOf(row: SupabaseRaceResultRow | undefined): number | null {
    if (!row) return null;

    const first = parseJsonField<DriverResult>(row.classification_json).find(
        (d) => d.position === 1 && !d.dnf && !d.dns && !d.dsq
    );
    return first?.driverNumber ?? null;
}

function toStat(
    key: string,
    name: string,
    teamName: string,
    teamColor: string,
    counts: Counts
): PoleStat {
    return {
        key,
        name,
        teamName,
        teamColor,
        ...counts,
        conversion: counts.poles > 0 ? counts.winsFromPole / counts.poles : null,
    };
}

export function buildPoleStats(
    rows: SupabaseRaceResultRow[],
    drivers: DriverStanding[]
): PoleSummary {
    // Pole = fastest in Qualifying (not Sprint Qualifying), regardless of grid penalties.
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

    const counts = new Map<number, Counts>();
    const bump = (driverNumber: number, field: keyof Counts) => {
        const current = counts.get(driverNumber) ?? { poles: 0, wins: 0, winsFromPole: 0 };
        current[field]++;
        counts.set(driverNumber, current);
    };

    let racesCompared = 0;
    let poleSitterWon = 0;

    for (const { quali, race } of byMeeting.values()) {
        const pole = topOf(quali);
        const winner = topOf(race);

        if (pole != null) bump(pole, 'poles');
        if (winner != null) bump(winner, 'wins');

        if (pole != null && winner != null) {
            racesCompared++;
            if (pole === winner) {
                poleSitterWon++;
                bump(pole, 'winsFromPole');
            }
        }
    }

    const sort = (a: PoleStat, b: PoleStat) =>
        b.poles - a.poles || b.wins - a.wins || a.name.localeCompare(b.name);

    const driverStats: PoleStat[] = [];
    const teamCounts = new Map<string, { counts: Counts; color: string }>();

    for (const [driverNumber, c] of counts) {
        if (c.poles === 0 && c.wins === 0) continue;

        const standing = drivers.find((d) => d.driverNumber === driverNumber);
        const name = standing?.driverName ?? `Driver ${driverNumber}`;
        const teamName = standing?.teamName ?? 'Unknown';
        const teamColor = standing?.teamColor ?? '71717a';

        driverStats.push(toStat(String(driverNumber), name, teamName, teamColor, c));

        const team = teamCounts.get(teamName) ?? {
            counts: { poles: 0, wins: 0, winsFromPole: 0 },
            color: teamColor,
        };
        team.counts.poles += c.poles;
        team.counts.wins += c.wins;
        team.counts.winsFromPole += c.winsFromPole;
        teamCounts.set(teamName, team);
    }

    const teamStats = [...teamCounts.entries()].map(([teamName, t]) =>
        toStat(teamName, teamName, teamName, t.color, t.counts)
    );

    return {
        drivers: driverStats.sort(sort),
        teams: teamStats.sort(sort),
        racesCompared,
        poleSitterWon,
    };
}