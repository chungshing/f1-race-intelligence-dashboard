import { jolpica } from '@/lib/jolpica';

const CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800';
const DAY_MS = 24 * 60 * 60 * 1000;
const WINNERS_SHOWN = 10;
const LEADERBOARD_SIZE = 5;

function tally(names: string[]) {
    const counts = new Map<string, number>();
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);

    return [...counts.entries()]
        .map(([name, wins]) => ({ name, wins }))
        .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
        .slice(0, LEADERBOARD_SIZE);
}

export async function GET(request: Request) {
    const date = new URL(request.url).searchParams.get('date') ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return Response.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
    }

    const season = Number(date.slice(0, 4));
    const target = Date.parse(date);

    // Match our race to Jolpica's calendar by date (within a day, for time zones).
    const calendar = await jolpica(`/${season}.json?limit=100`);
    const race = calendar?.MRData.RaceTable?.Races.find(
        (r) => Math.abs(Date.parse(r.date) - target) <= DAY_MS
    );
    if (!race) return Response.json({ error: 'Race not found' }, { status: 404 });

    const history = await jolpica(`/circuits/${race.Circuit.circuitId}/results/1.json?limit=100`);
    if (!history) return Response.json({ error: 'History unavailable' }, { status: 502 });

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

    // Where the winners started from, across every past race here.
    const known = past.filter((w) => Number.isFinite(w.grid));
    const onGrid = known.filter((w) => w.grid > 0);
    const starts = {
        pole: known.filter((w) => w.grid === 1).length,
        front: known.filter((w) => w.grid >= 2 && w.grid <= 3).length,
        midfield: known.filter((w) => w.grid >= 4 && w.grid <= 10).length,
        back: known.filter((w) => w.grid > 10).length,
        pit: known.filter((w) => w.grid === 0).length,
        known: known.length,
        average: onGrid.length ? onGrid.reduce((sum, w) => sum + w.grid, 0) / onGrid.length : null,
    };

    const topDrivers = tally(past.map((w) => w.driver));
    const topTeams = tally(past.map((w) => w.team));

    return Response.json(
        {
            winners: past.slice(0, WINNERS_SHOWN),
            totalRaces: past.length,
            mostWins: topDrivers[0]
                ? { driver: topDrivers[0].name, wins: topDrivers[0].wins }
                : null,
            topDrivers,
            topTeams,
            starts,
        },
        { headers: { 'Cache-Control': CACHE } }
    );
}
