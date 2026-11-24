import { jolpica, jolpicaTotal, matchDriverId } from '@/lib/jolpica';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINNERS_SHOWN = 10;
const LEADERBOARD_SIZE = 5;

export type HistoryResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

const fail = (status: number, error: string) => ({ ok: false as const, status, error });

export interface WinTally {
    name: string;
    wins: number;
}

export interface CircuitHistoryData {
    winners: { season: number; raceName: string; driver: string; team: string; grid: number }[];
    totalRaces: number;
    mostWins: { driver: string; wins: number } | null;
    topDrivers: WinTally[];
    topTeams: WinTally[];
    starts: {
        pole: number;
        front: number;
        midfield: number;
        back: number;
        pit: number;
        known: number;
        average: number | null;
    };
}

export interface DriverCareerData {
    wins: number | null;
    poles: number | null;
    podiums: number | null;
    titles: number | null;
    starts: number | null;
    failed: string[];
}

function tally(names: string[]): WinTally[] {
    const counts = new Map<string, number>();
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);

    return [...counts.entries()]
        .map(([name, wins]) => ({ name, wins }))
        .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
        .slice(0, LEADERBOARD_SIZE);
}

/** Past winners at the circuit of the race held on `date` (YYYY-MM-DD). */
export async function fetchCircuitHistory(
    date: string
): Promise<HistoryResult<CircuitHistoryData>> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(400, 'date must be YYYY-MM-DD');

    const season = Number(date.slice(0, 4));
    const target = Date.parse(date);

    // Match our race to Jolpica's calendar by date (within a day, for time zones).
    const calendar = await jolpica(`/${season}.json?limit=100`);
    const race = calendar?.MRData.RaceTable?.Races.find(
        (r) => Math.abs(Date.parse(r.date) - target) <= DAY_MS
    );
    if (!race) return fail(404, 'Race not found');

    const history = await jolpica(`/circuits/${race.Circuit.circuitId}/results/1.json?limit=100`);
    if (!history) return fail(502, 'History unavailable');

    const past = (history.MRData.RaceTable?.Races ?? [])
        .filter((r) => Number(r.season) < season && r.Results?.[0])
        .map((r) => ({
            season: Number(r.season),
            raceName: r.raceName,
            driver: `${r.Results![0].Driver.givenName} ${r.Results![0].Driver.familyName}`,
            team: r.Results![0].Constructor.name,
            grid: Number(r.Results![0].grid),
        }))
        .sort((a, b) => b.season - a.season);

    const known = past.filter((w) => Number.isFinite(w.grid));
    const onGrid = known.filter((w) => w.grid > 0);

    const topDrivers = tally(past.map((w) => w.driver));
    const topTeams = tally(past.map((w) => w.team));

    return {
        ok: true,
        data: {
            winners: past.slice(0, WINNERS_SHOWN),
            totalRaces: past.length,
            mostWins: topDrivers[0]
                ? { driver: topDrivers[0].name, wins: topDrivers[0].wins }
                : null,
            topDrivers,
            topTeams,
            starts: {
                pole: known.filter((w) => w.grid === 1).length,
                front: known.filter((w) => w.grid >= 2 && w.grid <= 3).length,
                midfield: known.filter((w) => w.grid >= 4 && w.grid <= 10).length,
                back: known.filter((w) => w.grid > 10).length,
                pit: known.filter((w) => w.grid === 0).length,
                known: known.length,
                average: onGrid.length
                    ? onGrid.reduce((sum, w) => sum + w.grid, 0) / onGrid.length
                    : null,
            },
        },
    };
}

/** Career totals for a current driver, matched by full name. */
export async function fetchDriverCareer(name: string): Promise<HistoryResult<DriverCareerData>> {
    const drivers = await jolpica('/current/drivers.json?limit=100');
    const id = matchDriverId(name, drivers?.MRData.DriverTable?.Drivers ?? []);
    if (!id) return fail(404, 'Driver not found');

    // Sequential on purpose: Jolpica allows only a few requests per second.
    const wins = await jolpicaTotal(`/drivers/${id}/results/1.json?limit=1`);
    const second = await jolpicaTotal(`/drivers/${id}/results/2.json?limit=1`);
    const third = await jolpicaTotal(`/drivers/${id}/results/3.json?limit=1`);
    const poles = await jolpicaTotal(`/drivers/${id}/qualifying/1.json?limit=1`);
    const titles = await jolpicaTotal(`/drivers/${id}/driverStandings/1.json?limit=1`);
    const starts = await jolpicaTotal(`/drivers/${id}/results.json?limit=1`);

    const podiums =
        wins === null || second === null || third === null ? null : wins + second + third;
    const stats = { wins, poles, podiums, titles, starts };
    const failed = Object.entries(stats)
        .filter(([, value]) => value === null)
        .map(([key]) => key);

    if (failed.length === Object.keys(stats).length) {
        return fail(502, 'History temporarily unavailable');
    }

    return { ok: true, data: { ...stats, failed } };
}
