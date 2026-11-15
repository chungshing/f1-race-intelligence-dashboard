import { RaceWeekend } from '@/types/race';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MAX_FORECAST_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

export type WeatherKind =
    | 'clear'
    | 'partly'
    | 'cloud'
    | 'fog'
    | 'drizzle'
    | 'rain'
    | 'snow'
    | 'storm';

export type RainRisk = 'Low' | 'Medium' | 'High';

export interface SessionWeather {
    kind: WeatherKind;
    description: string;
    temp: number;
    rainChance: number;
}

export interface RaceWeather {
    status: 'ok' | 'too-far';
    place: string;
    availableFrom?: string;
    /** Forecast for the hour each session starts, keyed by session name */
    sessions: Record<string, SessionWeather>;
}

interface GeoResult {
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
}

interface ForecastResponse {
    utc_offset_seconds: number;
    hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: (number | null)[];
        weather_code: number[];
    };
}

export function describeWeather(code: number): { kind: WeatherKind; label: string } {
    if (code === 0) return { kind: 'clear', label: 'Clear' };
    if (code <= 2) return { kind: 'partly', label: 'Partly cloudy' };
    if (code === 3) return { kind: 'cloud', label: 'Overcast' };
    if (code === 45 || code === 48) return { kind: 'fog', label: 'Fog' };
    if (code >= 51 && code <= 57) return { kind: 'drizzle', label: 'Drizzle' };
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
        return { kind: 'rain', label: 'Rain' };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86)
        return { kind: 'snow', label: 'Snow' };
    if (code >= 95) return { kind: 'storm', label: 'Thunderstorm' };
    return { kind: 'cloud', label: 'Cloudy' };
}

export function rainRisk(chance: number): RainRisk {
    if (chance >= 55) return 'High';
    if (chance >= 25) return 'Medium';
    return 'Low';
}

async function geocode(circuit: string, country: string) {
    const wanted = country.toLowerCase();

    // Circuit name first, then fall back to the country.
    for (const query of [circuit, country]) {
        const res = await fetch(
            `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
        );
        if (!res.ok) continue;

        const results: GeoResult[] = (await res.json()).results ?? [];
        if (results.length === 0) continue;

        const match =
            results.find(
                (r) =>
                    r.country &&
                    (r.country.toLowerCase().includes(wanted) ||
                        wanted.includes(r.country.toLowerCase()))
            ) ?? results[0];

        return {
            latitude: match.latitude,
            longitude: match.longitude,
            place: [match.name, match.country].filter(Boolean).join(', '),
        };
    }

    throw new Error('Location not found');
}

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export async function fetchRaceWeather(race: RaceWeekend): Promise<RaceWeather> {
    const starts = race.sessions.map((s) => Date.parse(s.dateStart)).filter(Number.isFinite);
    const ends = race.sessions.map((s) => Date.parse(s.dateEnd)).filter(Number.isFinite);
    if (starts.length === 0) throw new Error('No sessions');

    const firstStart = Math.min(...starts);
    const lastEnd = Math.max(...ends, ...starts);
    const now = Date.now();

    const geo = await geocode(race.circuit, race.country);

    // The forecast only reaches about 15 days ahead.
    if (firstStart - DAY_MS > now + MAX_FORECAST_DAYS * DAY_MS) {
        return {
            status: 'too-far',
            place: geo.place,
            availableFrom: isoDate(firstStart - MAX_FORECAST_DAYS * DAY_MS),
            sessions: {},
        };
    }

    const params = new URLSearchParams({
        latitude: String(geo.latitude),
        longitude: String(geo.longitude),
        timezone: 'auto',
        start_date: isoDate(Math.max(firstStart - DAY_MS, now - DAY_MS)),
        end_date: isoDate(Math.min(lastEnd + DAY_MS, now + MAX_FORECAST_DAYS * DAY_MS)),
        hourly: 'temperature_2m,precipitation_probability,weather_code',
    });

    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) throw new Error('Forecast unavailable');
    const data: ForecastResponse = await res.json();

    // Session times are UTC; shift by the venue's offset to get the local hour.
    const toLocal = (ms: number) => new Date(ms + data.utc_offset_seconds * 1000).toISOString();

    const sessions: Record<string, SessionWeather> = {};
    for (const session of race.sessions) {
        const local = toLocal(Date.parse(session.dateStart));
        const i = data.hourly.time.indexOf(`${local.slice(0, 13)}:00`);
        if (i === -1) continue;

        // Rain chance is the worst of the session's first two hours.
        const window = [i, i + 1].filter((k) => k < data.hourly.time.length);
        const weather = describeWeather(data.hourly.weather_code[i]);

        sessions[session.sessionName] = {
            kind: weather.kind,
            description: weather.label,
            temp: data.hourly.temperature_2m[i],
            rainChance: Math.max(
                ...window.map((k) => data.hourly.precipitation_probability[k] ?? 0)
            ),
        };
    }

    return { status: 'ok', place: geo.place, sessions };
}
