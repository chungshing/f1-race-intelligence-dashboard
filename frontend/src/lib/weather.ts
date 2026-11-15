import { RaceWeekend } from '@/types/race';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MAX_FORECAST_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const RACE_WINDOW_HOURS = 2;

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

export interface WeatherDay {
    date: string;
    label: string;
    isRaceDay: boolean;
    kind: WeatherKind;
    description: string;
    tempMax: number;
    tempMin: number;
    rainChance: number;
    rainMm: number;
    windMax: number;
}

export interface RaceHourWeather {
    localTime: string;
    temp: number;
    rainChance: number;
    rainMm: number;
    wind: number;
    kind: WeatherKind;
    description: string;
    risk: RainRisk;
}

export interface RaceWeather {
    status: 'ok' | 'too-far';
    place: string;
    availableFrom?: string;
    days: WeatherDay[];
    race: RaceHourWeather | null;
}

interface GeoResult {
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
}

interface ForecastResponse {
    utc_offset_seconds: number;
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: (number | null)[];
        precipitation_sum: (number | null)[];
        wind_speed_10m_max: number[];
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: (number | null)[];
        precipitation: (number | null)[];
        wind_speed_10m: number[];
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
            days: [],
            race: null,
        };
    }

    const params = new URLSearchParams({
        latitude: String(geo.latitude),
        longitude: String(geo.longitude),
        timezone: 'auto',
        start_date: isoDate(Math.max(firstStart - DAY_MS, now - DAY_MS)),
        end_date: isoDate(Math.min(lastEnd + DAY_MS, now + MAX_FORECAST_DAYS * DAY_MS)),
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_probability_max',
            'precipitation_sum',
            'wind_speed_10m_max',
        ].join(','),
        hourly: [
            'temperature_2m',
            'precipitation_probability',
            'precipitation',
            'wind_speed_10m',
            'weather_code',
        ].join(','),
    });

    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) throw new Error('Forecast unavailable');
    const data: ForecastResponse = await res.json();

    // Session times are UTC; shift by the venue's offset to get the local date and hour.
    const toLocal = (ms: number) => new Date(ms + data.utc_offset_seconds * 1000).toISOString();

    const raceSession = race.sessions.find((s) => s.sessionName === 'Race');
    const raceLocalDate = raceSession
        ? toLocal(Date.parse(raceSession.dateStart)).slice(0, 10)
        : null;

    const localDates = [...new Set(starts.map((ms) => toLocal(ms).slice(0, 10)))].sort();

    const days: WeatherDay[] = [];
    for (const date of localDates) {
        const i = data.daily.time.indexOf(date);
        if (i === -1) continue;

        const weather = describeWeather(data.daily.weather_code[i]);
        days.push({
            date,
            label: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC',
            }),
            isRaceDay: date === raceLocalDate,
            kind: weather.kind,
            description: weather.label,
            tempMax: data.daily.temperature_2m_max[i],
            tempMin: data.daily.temperature_2m_min[i],
            rainChance: data.daily.precipitation_probability_max[i] ?? 0,
            rainMm: data.daily.precipitation_sum[i] ?? 0,
            windMax: data.daily.wind_speed_10m_max[i],
        });
    }

    let raceHour: RaceHourWeather | null = null;
    if (raceSession) {
        const local = toLocal(Date.parse(raceSession.dateStart));
        const start = data.hourly.time.indexOf(`${local.slice(0, 13)}:00`);

        if (start !== -1) {
            const idx = Array.from({ length: RACE_WINDOW_HOURS }, (_, k) => start + k).filter(
                (k) => k < data.hourly.time.length
            );
            const rainChance = Math.max(
                ...idx.map((k) => data.hourly.precipitation_probability[k] ?? 0)
            );
            const weather = describeWeather(data.hourly.weather_code[start]);

            raceHour = {
                localTime: local.slice(11, 16),
                temp: data.hourly.temperature_2m[start],
                rainChance,
                rainMm: idx.reduce((sum, k) => sum + (data.hourly.precipitation[k] ?? 0), 0),
                wind: Math.max(...idx.map((k) => data.hourly.wind_speed_10m[k])),
                kind: weather.kind,
                description: weather.label,
                risk: rainRisk(rainChance),
            };
        }
    }

    return { status: 'ok', place: geo.place, days, race: raceHour };
}
