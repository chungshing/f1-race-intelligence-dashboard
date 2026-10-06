export async function POST(request: Request) {
    const { meetingKey } = await request.json();
    const backendUrl =
        process.env.BACKEND_BASE_URL ?? 'https://f1-race-intelligence-dashboard.onrender.com';

    try {
        const res = await fetch(`${backendUrl}/api/v1/automation/backfill/${meetingKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: process.env.CRON_SECRET_TOKEN }),
        });
        const text = await res.text();
        return new Response(text, { status: res.status });
    } catch {
        return Response.json({ error: 'Failed to reach backend' }, { status: 503 });
    }
}
