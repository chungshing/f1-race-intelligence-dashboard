import { fetchDriverCareer } from '@/lib/history';

export const maxDuration = 60;
const CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800';

export async function GET(request: Request) {
    const name = new URL(request.url).searchParams.get('name')?.trim().slice(0, 80);
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 });

    const result = await fetchDriverCareer(name);
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

    // Only cache complete answers, so a hiccup isn't remembered for a day.
    return Response.json(result.data, {
        headers: { 'Cache-Control': result.data.failed.length === 0 ? CACHE : 'no-store' },
    });
}
