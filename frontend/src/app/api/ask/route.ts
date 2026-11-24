import { mapRaceWeekends } from '@/hooks/useRaceWeekends';
import { mapDriverStandings, mapTeamStandings } from '@/hooks/useStandings';
import {
    getLapsBySession,
    getRaceResults,
    getRaces,
    getStandings,
    getTeamStandings,
} from '@/lib/app';
import { buildConstructorProfile } from '@/lib/constructorProfile';
import { fetchCircuitHistory, fetchDriverCareer } from '@/lib/history';
import { buildRaceStory } from '@/lib/raceStory';
import { fetchRaceWeather, rainRisk } from '@/lib/weather';
import {
    DriverResult,
    PitStop,
    RaceControlEvent,
    StartingGridEntry,
    Stint,
    WeatherSnapshot,
} from '@/types/results';
import { parseJsonField } from '@/utils/form';
import { isQualifyingSession } from '@/utils/gridVsRace';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-flash-lite-latest';
const MAX_STEPS = 6;
const RATE_LIMIT = 15; // requests per minute per IP
const hits = new Map<string, number[]>();

const SYSTEM = `You are the race analyst for an F1 dashboard.

Rules:
- Use only data from the tools. Never guess or invent results, times or events.
- If the data can't answer something, say so.
- Keep answers short and clear. Use bullet points, and bold for key numbers.
- "last", "latest" or "most recent" race means country "latest". "next" race means country "next".

How to answer:
- "Why didn't X win?" or "Why did X finish there?": get the result with get_session_results, then get_race_story for X. Explain in this order: starting position, which stint lost time, pit stops, safety cars, position changes. Include the numbers.
- For wet or mixed races, check the weather in get_session_results.
- For a driver's whole season, use get_driver_season. For their career totals (titles, wins, poles), use get_driver_career.
- For a team's whole season, use get_team_season.
- For a circuit's history (past winners, who wins here, does pole matter), use get_circuit_history.
- For the weather forecast of an upcoming race, use get_race_forecast.`;

type Args = Record<string, unknown>;

const COUNTRY_DESCRIPTION =
    'Race country or circuit, e.g. Singapore. Use "latest" for the most recent completed race and "next" for the upcoming one.';

const readTools = [
    {
        name: 'list_races',
        description:
            'List race weekends in chronological order (round, country, circuit, year, race date).',
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
            'Classification, starting grid, places gained, pit stops, tyre stints and key race control events (safety cars, red flags, penalties) for one session of a race weekend.',
        parameters: {
            type: 'OBJECT',
            properties: {
                country: { type: 'STRING', description: COUNTRY_DESCRIPTION },
                session: {
                    type: 'STRING',
                    description: 'Session name: Race (default), Qualifying, Sprint',
                },
            },
            required: ['country'],
        },
    },
    {
        name: 'get_race_story',
        description:
            'Lap-by-lap race analysis for selected drivers: position every lap, per-stint clean-lap pace, pace delta versus the winner on the same laps, gap to leader, pit stops and safety car windows. Use this to explain WHY a driver finished where they did or lost time. The winner is always included for comparison.',
        parameters: {
            type: 'OBJECT',
            properties: {
                country: { type: 'STRING', description: COUNTRY_DESCRIPTION },
                drivers: {
                    type: 'STRING',
                    description:
                        'Comma-separated driver surnames, e.g. "Verstappen, Norris". Max 4. Omit for the top 3.',
                },
            },
            required: ['country'],
        },
    },
    {
        name: 'get_driver_season',
        description:
            "A driver's whole season: qualifying, sprint and race result per round, plus championship position and points. Use for questions about form, consistency or how a season has gone.",
        parameters: {
            type: 'OBJECT',
            properties: {
                driver: { type: 'STRING', description: 'Driver surname, e.g. "Norris"' },
            },
            required: ['driver'],
        },
    },
    {
        name: 'get_team_season',
        description:
            "A team's whole season: championship position and points, wins, podiums, DNFs, points per driver, pit stop speed and a round-by-round breakdown of both drivers' results. Use for questions about how a team is doing.",
        parameters: {
            type: 'OBJECT',
            properties: {
                team: { type: 'STRING', description: 'Team name, e.g. "Ferrari" or "Red Bull"' },
            },
            required: ['team'],
        },
    },
    {
        name: 'get_circuit_history',
        description:
            "A circuit's racing history: past winners, who has won most (drivers and teams), and where winners started on the grid (pole, front row, midfield, back). Use for questions about a track, such as who wins here or whether pole matters.",
        parameters: {
            type: 'OBJECT',
            properties: { country: { type: 'STRING', description: COUNTRY_DESCRIPTION } },
            required: ['country'],
        },
    },
    {
        name: 'get_driver_career',
        description:
            "A current driver's career totals: titles, wins, poles, podiums and race starts. Use for questions about a driver's overall record or experience.",
        parameters: {
            type: 'OBJECT',
            properties: {
                driver: { type: 'STRING', description: 'Driver surname, e.g. "Hamilton"' },
            },
            required: ['driver'],
        },
    },
    {
        name: 'get_race_forecast',
        description:
            'Weather forecast for an upcoming race weekend: conditions, temperature and chance of rain for each session. Only works for races that have not happened yet and are within about 15 days. For a race that already happened, use get_session_results instead.',
        parameters: {
            type: 'OBJECT',
            properties: { country: { type: 'STRING', description: COUNTRY_DESCRIPTION } },
            required: ['country'],
        },
    },
];

async function driverNames() {
    const standings = await getStandings();
    return new Map<number, { name: string; team: string }>(
        standings.map((d): [number, { name: string; team: string }] => [
            Number(d.driver_number),
            {
                name: d.driver_name ?? `Driver ${d.driver_number}`,
                team: d.team_name ?? 'Unknown',
            },
        ])
    );
}

async function findRace(query: string) {
    const races = mapRaceWeekends(await getRaces()); // chronological
    const q = query.trim().toLowerCase();

    if (/^(next|upcoming)/.test(q)) {
        const now = Date.now();
        return (
            races.find((r) => {
                const race = r.sessions.find((s) => s.sessionName === 'Race');
                return race && new Date(race.dateEnd || race.dateStart).getTime() > now;
            }) ?? null
        );
    }

    if (/^(latest|last|recent|previous|newest)/.test(q)) {
        const now = Date.now();
        const finished = races.filter((r) => {
            const race = r.sessions.find((s) => s.sessionName === 'Race');
            return race && new Date(race.dateEnd).getTime() <= now;
        });
        for (let i = finished.length - 1; i >= 0; i--) {
            const rows = await getRaceResults(finished[i].meetingKey);
            const row = rows.find((r) => r.session_name === 'Race');
            if (row && parseJsonField<DriverResult>(row.classification_json).length > 0) {
                return finished[i];
            }
        }
        return null;
    }

    return (
        races.find(
            (r) => r.country.toLowerCase().includes(q) || r.circuit.toLowerCase().includes(q)
        ) ?? null
    );
}

async function sessionResults(args: Args) {
    const sessionName = String(args.session ?? 'Race').toLowerCase();

    const race = await findRace(String(args.country ?? ''));
    if (!race) return { error: `No race found for "${args.country}"` };

    const rows = await getRaceResults(race.meetingKey);
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

    const snapshots = parseJsonField<WeatherSnapshot>(row.weather_json);
    const mean = (values: (number | null)[]) => {
        const present = values.filter((v): v is number => typeof v === 'number');
        return present.length
            ? Number((present.reduce((sum, v) => sum + v, 0) / present.length).toFixed(1))
            : null;
    };
    const weather = snapshots.length
        ? {
              airTempC: mean(snapshots.map((w) => w.airTemperature)),
              trackTempC: mean(snapshots.map((w) => w.trackTemperature)),
              humidityPct: mean(snapshots.map((w) => w.humidity)),
              windMs: mean(snapshots.map((w) => w.windSpeed)),
              rainDuringSession: snapshots.some((w) => (w.rainfall ?? 0) > 0),
              shareOfTimeRaining: Number(
                  (
                      snapshots.filter((w) => (w.rainfall ?? 0) > 0).length / snapshots.length
                  ).toFixed(2)
              ),
          }
        : null;

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
        weather,
    };
}

async function raceStory(args: Args) {
    const race = await findRace(String(args.country ?? ''));
    if (!race) return { error: `No race found for "${args.country}"` };

    const rows = await getRaceResults(race.meetingKey);
    const row = rows.find((r) => r.session_name.toLowerCase() === 'race');
    if (!row) return { error: 'Race session not found' };

    let grid = parseJsonField<StartingGridEntry>(row.starting_grid_json)
        .filter((g) => g.position != null)
        .map((g) => ({ driverNumber: g.driverNumber, position: g.position }));
    if (grid.length === 0) {
        const quali = rows.find((r) => isQualifyingSession(r.session_name));
        if (quali) {
            grid = parseJsonField<DriverResult>(quali.classification_json)
                .filter((r) => r.position != null)
                .map((r) => ({ driverNumber: r.driverNumber, position: r.position }));
        }
    }

    const laps = await getLapsBySession(row.session_key);
    if (laps.length === 0) return { error: 'No lap data for this race' };

    return {
        country: race.country,
        ...buildRaceStory({
            laps,
            grid,
            stints: parseJsonField<Stint>(row.stints_json),
            pitStops: parseJsonField<PitStop>(row.pit_stops_json),
            raceControl: parseJsonField<RaceControlEvent>(row.race_control_json),
            classification: parseJsonField<DriverResult>(row.classification_json),
            names: await driverNames(),
            requested: String(args.drivers ?? ''),
        }),
    };
}

async function driverSeason(args: Args) {
    const query = String(args.driver ?? '')
        .toLowerCase()
        .trim();
    if (!query) return { error: 'driver is required' };

    const names = await driverNames();
    const match = [...names.entries()].find(([, v]) => v.name.toLowerCase().includes(query));
    if (!match) return { error: `No driver found for "${args.driver}"` };
    const [driverNumber, info] = match;

    const weekends = mapRaceWeekends(await getRaces());
    const roundOf = new Map(weekends.map((w, i) => [w.meetingKey, i + 1]));

    const byMeeting = new Map<
        number,
        {
            round: number;
            country: string;
            qualifying?: number | string | null;
            sprint?: number | string | null;
            race?: number | string | null;
        }
    >();

    for (const row of await getRaceResults()) {
        const name = row.session_name.toLowerCase();
        const kind = isQualifyingSession(row.session_name)
            ? 'qualifying'
            : name === 'race'
              ? 'race'
              : name === 'sprint'
                ? 'sprint'
                : null;
        if (!kind) continue;

        const result = parseJsonField<DriverResult>(row.classification_json).find(
            (r) => r.driverNumber === driverNumber
        );
        if (!result) continue;

        const entry = byMeeting.get(row.meeting_key) ?? {
            round: roundOf.get(row.meeting_key) ?? 0,
            country: row.country,
        };
        entry[kind] = result.dsq
            ? 'DSQ'
            : result.dnf
              ? 'DNF'
              : result.dns
                ? 'DNS'
                : result.position;
        byMeeting.set(row.meeting_key, entry);
    }

    const standing = (await getStandings()).find((d) => Number(d.driver_number) === driverNumber);

    return {
        driver: info.name,
        team: info.team,
        championshipPosition: standing ? Number(standing.position) : null,
        points: standing?.points != null ? Number(standing.points) : null,
        rounds: [...byMeeting.values()].sort((a, b) => a.round - b.round),
    };
}

async function teamSeason(args: Args) {
    const query = String(args.team ?? '')
        .toLowerCase()
        .trim();
    if (!query) return { error: 'team is required' };

    const teams = mapTeamStandings(await getTeamStandings());
    const team = teams.find((t) => t.teamName.toLowerCase().includes(query));
    if (!team) {
        return {
            error: `No team found for "${args.team}"`,
            available: teams.map((t) => t.teamName),
        };
    }

    const drivers = mapDriverStandings(await getStandings());
    const weekends = mapRaceWeekends(await getRaces());
    const profile = buildConstructorProfile(team, drivers, await getRaceResults(), weekends);

    const round = (value: number | null) => (value === null ? null : Number(value.toFixed(2)));

    return {
        team: profile.teamName,
        championshipPosition: profile.currentPosition,
        points: profile.currentPoints,
        wins: profile.stats.wins,
        podiums: profile.stats.podiums,
        dnfs: profile.stats.dnfCount,
        bestFinish: profile.stats.bestFinish,
        pointsByDriver: profile.driverContributions.map((d) => ({
            driver: d.driverName,
            points: d.totalPoints,
        })),
        pitStops: {
            medianSeconds: round(profile.pitStops.medianStop),
            bestSeconds: round(profile.pitStops.bestStop),
            rank:
                profile.pitStops.rank !== null
                    ? `${profile.pitStops.rank} of ${profile.pitStops.teamsRanked}`
                    : null,
            measuredAs: profile.pitStops.usingLaneDuration ? 'pit lane time' : 'stationary time',
        },
        rounds: profile.seasonResults.map((r) => ({
            round: r.round,
            country: r.country,
            teamPoints: r.teamPoints,
            cumulativePoints: r.cumulativePoints,
            drivers: r.driverBreakdown.map((d) => ({
                driver: d.driverName,
                result: d.dsq
                    ? 'DSQ'
                    : d.dnf
                      ? 'DNF'
                      : d.dns
                        ? 'DNS'
                        : d.position !== null
                          ? `P${d.position}`
                          : null,
                sprint: d.sprintPosition !== null ? `P${d.sprintPosition}` : undefined,
                points: d.points,
            })),
        })),
    };
}

async function circuitHistory(args: Args) {
    const race = await findRace(String(args.country ?? ''));
    if (!race) return { error: `No race found for "${args.country}"` };

    const date = race.sessions.find((s) => s.sessionName === 'Race')?.dateStart.slice(0, 10);
    if (!date) return { error: 'This weekend has no race session' };

    const result = await fetchCircuitHistory(date);
    if (!result.ok) return { error: result.error };

    return { circuit: race.circuit, country: race.country, ...result.data };
}

async function driverCareer(args: Args) {
    const query = String(args.driver ?? '')
        .toLowerCase()
        .trim();
    if (!query) return { error: 'driver is required' };

    const names = await driverNames();
    const match = [...names.values()].find((v) => v.name.toLowerCase().includes(query));
    if (!match) return { error: `No driver found for "${args.driver}"` };

    const result = await fetchDriverCareer(match.name);
    if (!result.ok) return { error: result.error };

    const { wins, starts } = result.data;
    return {
        driver: match.name,
        ...result.data,
        winRatePct: wins !== null && starts ? Number(((wins / starts) * 100).toFixed(1)) : null,
    };
}

async function raceForecast(args: Args) {
    const race = await findRace(String(args.country ?? 'next'));
    if (!race) return { error: `No race found for "${args.country}"` };

    const raceSession = race.sessions.find((s) => s.sessionName === 'Race');
    const raceEnd = Date.parse(raceSession?.dateEnd || raceSession?.dateStart || '');
    if (Number.isFinite(raceEnd) && raceEnd < Date.now()) {
        return {
            error: 'This race has already happened. Use get_session_results for the weather it had.',
        };
    }

    const weather = await fetchRaceWeather(race);
    if (weather.status === 'too-far') {
        return {
            country: race.country,
            forecast: 'not available yet',
            availableFrom: weather.availableFrom,
        };
    }

    const sessions = race.sessions
        .filter((s) => weather.sessions[s.sessionName])
        .sort((a, b) => Date.parse(a.dateStart) - Date.parse(b.dateStart))
        .map((s) => {
            const w = weather.sessions[s.sessionName];
            return {
                session: s.sessionName,
                conditions: w.description,
                tempC: Math.round(w.temp),
                rainChancePct: w.rainChance,
                wetRisk: rainRisk(w.rainChance),
            };
        });

    return {
        country: race.country,
        circuit: race.circuit,
        forecastFor: weather.place,
        sessions,
        note: 'Forecast for the hour each session starts, in local time at the circuit.',
    };
}

async function runTool(name: string, args: Args) {
    try {
        switch (name) {
            case 'list_races': {
                const races = mapRaceWeekends(await getRaces());
                return {
                    races: races.map((r, i) => ({
                        round: i + 1,
                        country: r.country,
                        circuit: r.circuit,
                        year: r.year,
                        raceDate: r.sessions.find((s) => s.sessionName === 'Race')?.dateStart,
                    })),
                    note: 'Chronological. To analyse the most recent completed race, pass country "latest" to the other tools.',
                };
            }
            case 'get_standings':
                return args.type === 'teams'
                    ? { teams: await getTeamStandings() }
                    : { drivers: await getStandings() };
            case 'get_session_results':
                return await sessionResults(args);
            case 'get_race_story':
                return await raceStory(args);
            case 'get_driver_season':
                return await driverSeason(args);
            case 'get_team_season':
                return await teamSeason(args);
            case 'get_circuit_history':
                return await circuitHistory(args);
            case 'get_driver_career':
                return await driverCareer(args);
            case 'get_race_forecast':
                return await raceForecast(args);
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
    } | null;
    if (!body?.messages?.length) return Response.json({ error: 'No messages' }, { status: 400 });

    const contents: unknown[] = body.messages.slice(-12).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.text).slice(0, 2000) }],
    }));
    const tools = [{ functionDeclarations: readTools }];

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
                    response: await runTool(c.functionCall!.name, c.functionCall!.args ?? {}),
                },
            }))
        );
        contents.push({ role: 'user', parts: responses });
    }

    return Response.json({ reply: 'Could not finish the analysis. Try a more specific question.' });
}
