import { getRaceResults, getRaces, getStandings, getTeamStandings } from '@/lib/app';
import { DriverResult, PitStop, RaceControlEvent, StartingGridEntry, Stint } from '@/types/results';
import { parseJsonField } from '@/utils/form';
import { isQualifyingSession } from '@/utils/gridVsRace';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
const MAX_STEPS = 6;
const RATE_LIMIT = 15; // requests per minute per IP
const hits = new Map<string, number[]>();

const SYSTEM = `You are the analyst for an F1 race intelligence dashboard. Answer only from tool data; never invent results, times or events. Use tools to look up the race, then explain with concrete evidence: grid position, pace/gap, pit stops, tyre stints, safety cars, penalties and retirements. If the data cannot explain something, say so. Be concise.`;

type Args = Record<string, unknown>;

const readTools = [
    {
        name: 'list_races',
        description: 'List race weekends (country, circuit, meeting_key, year) in the database.',
        parameters: { type: 'OBJECT', properties: {} },
    },
    {
        name: 'get_standings',
        description: 'Current championship standings.',
        parameters: {
            type: 'OBJECT',
            properties: { type: { type: 'STRING', description: 'drivers or teams' } },
            required: ['type'],
        },
    },
    {
        name: 'get_session_results',
        description:
            'Classification, starting grid, pit stops, tyre stints and key race control events (safety cars, red flags, penalties) for one session of a race weekend.',
        parameters: {
            type: 'OBJECT',
            properties: {
                country: { type: 'STRING', description: 'Race country or circuit, e.g. Brazil' },
                session: {
                    type: 'STRING',
                    description: 'Session name: Race (default), Qualifying, Sprint',
                },
            },
            required: ['country'],
        },
    },
];

const syncTool = {
    name: 'trigger_sync',
    description: 'Trigger the data sync pipeline. Only call when the user explicitly asks to sync.',
    parameters: { type: 'OBJECT', properties: {} },
};

async function driverNames() {
    const standings = await getStandings();
    return new Map(
        standings.map((d) => [d.driver_number, { name: d.driver_name, team: d.team_name }])
    );
}

async function sessionResults(args: Args) {
    const query = String(args.country ?? '').toLowerCase();
    const sessionName = String(args.session ?? 'Race').toLowerCase();

    const races = await getRaces();
    const race = races.find(
        (r) => r.country?.toLowerCase().includes(query) || r.circuit?.toLowerCase().includes(query)
    );
    if (!race) return { error: `No race found for "${args.country}"` };

    const rows = await getRaceResults(race.meeting_key);
    const row = rows.find((r) => r.session_name.toLowerCase() === sessionName);
    if (!row) return { error: 'Session not found', available: rows.map((r) => r.session_name) };

    const names = await driverNames();
    const who = (n: number) => names.get(n)?.name ?? `Driver ${n}`;

        let gridEntries = parseJsonField<StartingGridEntry>(row.starting_grid_json)
            .filter((g) => g.position != null)
            .map((g) => ({ driverNumber: g.driverNumber, pos: g.position as number }));
        let gridSource = 'starting grid';

        if (gridEntries.length === 0 && sessionName === 'race') {
            const quali = rows.find((r) => isQualifyingSession(r.session_name));
            if (quali) {
                gridEntries = parseJsonField<DriverResult>(quali.classification_json)
                    .filter((r) => r.position != null)
                    .map((r) => ({ driverNumber: r.driverNumber, pos: r.position as number }));
                gridSource = 'qualifying classification (grid penalties not included)';
            }
        }

        const gridPos = new Map(gridEntries.map((g) => [g.driverNumber, g.pos]));

        const classification = parseJsonField<DriverResult>(row.classification_json).map((r) => {
            const start = gridPos.get(r.driverNumber) ?? null;
            return {
                pos: r.position,
                driver: who(r.driverNumber),
                team: names.get(r.driverNumber)?.team,
                time: r.formattedDuration,
                gap: r.gapToLeader,
                status: r.dsq ? 'DSQ' : r.dnf ? 'DNF' : r.dns ? 'DNS' : 'Finished',
                grid: start,
                placesGained: start !== null && r.position !== null ? start - r.position : null,
            };
        });

        const grid = gridEntries
            .sort((a, b) => a.pos - b.pos)
            .map((g) => ({ pos: g.pos, driver: who(g.driverNumber) }));
            
    const pitStops = parseJsonField<PitStop>(row.pit_stops_json).map((p) => ({
        driver: who(p.driver_number),
        lap: p.lap_number,
        laneSeconds: p.lane_duration,
        stopSeconds: p.stop_duration,
    }));

    const stintsByDriver = new Map<string, string[]>();
    for (const s of parseJsonField<Stint>(row.stints_json)) {
        const list = stintsByDriver.get(who(s.driver_number)) ?? [];
        list.push(`${s.compound} L${s.lap_start}-${s.lap_end}`);
        stintsByDriver.set(who(s.driver_number), list);
    }

    const raceControl = parseJsonField<RaceControlEvent>(row.race_control_json)
        .filter((e) => {
            const text = `${e.category ?? ''} ${e.flag ?? ''} ${e.message ?? ''}`.toUpperCase();
            return /SAFETY|VSC|RED|PENALTY|COLLISION|RETIRED|STOP\/GO/.test(text);
        })
        .slice(0, 30)
        .map((e) => ({ lap: e.lapNumber, message: e.message }));

    return {
        country: race.country,
        circuit: race.circuit,
        session: row.session_name,
        classification,
        grid,
        gridSource,
        pitStops,
        stints: Object.fromEntries(stintsByDriver),
        raceControl,
    };
}

async function triggerSync() {
    const backendUrl =
        process.env.BACKEND_BASE_URL ?? 'https://f1-race-intelligence-dashboard.onrender.com';
    const res = await fetch(`${backendUrl}/api/v1/automation/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: process.env.CRON_SECRET_TOKEN }),
    });
    return { status: res.status, started: res.status === 202 };
}

async function runTool(name: string, args: Args, isAdmin: boolean) {
    try {
        switch (name) {
            case 'list_races': {
                const races = await getRaces();
                return {
                    races: races.map((r) => ({
                        meeting_key: r.meeting_key,
                        country: r.country,
                        circuit: r.circuit,
                        year: r.year,
                    })),
                };
            }
            case 'get_standings':
                return args.type === 'teams'
                    ? { teams: await getTeamStandings() }
                    : { drivers: await getStandings() };
            case 'get_session_results':
                return await sessionResults(args);
            case 'trigger_sync':
                return isAdmin ? await triggerSync() : { error: 'Admin token required' };
            default:
                return { error: `Unknown tool ${name}` };
        }
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'Tool failed' };
    }
}

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > RATE_LIMIT;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    if (rateLimited(ip)) return Response.json({ error: 'Too many requests' }, { status: 429 });

    const body = (await request.json().catch(() => null)) as {
        messages?: ChatMessage[];
        adminToken?: string;
    } | null;
    if (!body?.messages?.length) return Response.json({ error: 'No messages' }, { status: 400 });

    const adminSecret = process.env.ADMIN_TOKEN;
    const isAdmin = !!adminSecret && body.adminToken === adminSecret;

    const contents: unknown[] = body.messages.slice(-12).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.text).slice(0, 2000) }],
    }));

    const tools = [{ functionDeclarations: isAdmin ? [...readTools, syncTool] : readTools }];

    for (let step = 0; step < MAX_STEPS; step++) {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYSTEM }] },
                    contents,
                    tools,
                }),
            }
        );

        if (res.status === 429)
            return Response.json(
                { error: 'Gemini free-tier limit reached. Try again shortly.' },
                { status: 429 }
            );
        if (!res.ok) {
            const detail = await res.text();
            return Response.json(
                { error: `Gemini ${res.status} (${MODEL}): ${detail.slice(0, 300)}` },
                { status: 502 }
            );
        }

        const data = await res.json();
        const content = data.candidates?.[0]?.content;
        const parts: {
            text?: string;
            functionCall?: { name: string; args?: Args };
        }[] = content?.parts ?? [];

        const calls = parts.filter((p) => p.functionCall);
        if (calls.length === 0) {
            const reply = parts
                .map((p) => p.text ?? '')
                .join('')
                .trim();
            return Response.json({ reply: reply || 'No answer.' });
        }

        contents.push(content);
        const responses = await Promise.all(
            calls.map(async (c) => ({
                functionResponse: {
                    name: c.functionCall!.name,
                    response: await runTool(
                        c.functionCall!.name,
                        c.functionCall!.args ?? {},
                        isAdmin
                    ),
                },
            }))
        );
        contents.push({ role: 'user', parts: responses });
    }

    return Response.json({ reply: 'Could not finish the analysis. Try a more specific question.' });
}
