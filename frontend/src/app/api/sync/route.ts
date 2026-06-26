export async function POST() {
    try {
        const res = await fetch(
            'https://f1-race-intelligence-dashboard.onrender.com/api/v1/automation/trigger',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: process.env.CRON_SECRET_TOKEN }),
            },
        );
        return Response.json({}, { status: res.status });
    } catch {
        return Response.json({ error: 'Failed to reach backend' }, { status: 503 });
    }
}
