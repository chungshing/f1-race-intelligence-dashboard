import { jolpica, jolpicaTotal, matchDriverId } from '@/lib/jolpica';

const CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800';

export async function GET(request: Request) {
    const name = new URL(request.url).searchParams.get('name')?.trim().slice(0, 80);
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 });

    const drivers = await jolpica('/current/drivers.json?limit=100');
    const id = matchDriverId(name, drivers?.MRData.DriverTable?.Drivers ?? []);
    if (!id) return Response.json({ error: 'Driver not found' }, { status: 404 });

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
        return Response.json({ error: 'History temporarily unavailable' }, { status: 502 });
    }

    // Only cache complete answers, so a hiccup isn't remembered for a day.
    return Response.json(
        { ...stats, failed },
        { headers: { 'Cache-Control': failed.length === 0 ? CACHE : 'no-store' } }
    );
}
