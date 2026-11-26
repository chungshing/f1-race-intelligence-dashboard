import { fetchCircuitHistory } from '@/lib/history';

const CACHE = 'public, s-maxage=86400, stale-while-revalidate=604800';

export async function GET(request: Request) {
    const date = new URL(request.url).searchParams.get('date') ?? '';

    const result = await fetchCircuitHistory(date);
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

    return Response.json(result.data, { headers: { 'Cache-Control': CACHE } });
}
