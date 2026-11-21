import { jolpica } from '@/lib/jolpica';

const CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800';
const DAY_MS = 24 * 60 * 60 * 1000;
const WINNERS_SHOWN = 10;

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
        }))
        .sort((a, b) => b.season - a.season);

    const counts = new Map<string, number>();
    for (const winner of past) counts.set(winner.driver, (counts.get(winner.driver) ?? 0) + 1);
    const [topDriver, topWins] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

    return Response.json(
        {
            winners: past.slice(0, WINNERS_SHOWN),
            totalRaces: past.length,
            mostWins: topDriver ? { driver: topDriver, wins: topWins } : null,
        },
        { headers: { 'Cache-Control': CACHE } }
    );
}
