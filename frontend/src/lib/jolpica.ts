const BASE = 'https://api.jolpi.ca/ergast/f1';
const ONE_DAY = 24 * 60 * 60;

export interface JolpicaDriver {
    driverId: string;
    givenName: string;
    familyName: string;
}

export interface JolpicaRace {
    season: string;
    round: string;
    raceName: string;
    date: string;
    Circuit: { circuitId: string };
    Results?: { Driver: JolpicaDriver; Constructor: { name: string } }[];
}

export interface JolpicaResponse {
    MRData: {
        total?: string;
        DriverTable?: { Drivers: JolpicaDriver[] };
        RaceTable?: { Races: JolpicaRace[] };
    };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Jolpica allows about 4 requests per second, so every call reserves a slot 300ms after the last.
const SPACING_MS = 300;
let nextSlot = 0;

async function throttle() {
    const now = Date.now();
    const slot = Math.max(now, nextSlot);
    nextSlot = slot + SPACING_MS;
    if (slot > now) await wait(slot - now);
}

/** One cached GET. Spaced out, and retried if Jolpica still rate-limits us. */
export async function jolpica(path: string): Promise<JolpicaResponse | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await throttle();
            const res = await fetch(
                `${BASE}${path}`,
                attempt === 0 ? { next: { revalidate: ONE_DAY } } : { cache: 'no-store' }
            );

            if (res.status === 429) {
                const retryAfter = Number(res.headers.get('retry-after'));
                console.warn(`Jolpica 429 for ${path}`);
                await wait(
                    Math.min(
                        Number.isFinite(retryAfter) && retryAfter > 0
                            ? retryAfter * 1000
                            : 1000 * (attempt + 1),
                        5000
                    )
                );
                continue;
            }
            if (!res.ok) {
                console.warn(`Jolpica ${res.status} for ${path}`);
                return null;
            }
            return (await res.json()) as JolpicaResponse;
        } catch (error) {
            console.warn(`Jolpica request failed for ${path}`, error);
            return null;
        }
    }
    return null;
}

/** The `total` field of a Jolpica response, which is the count of matching rows. */
export async function jolpicaTotal(path: string): Promise<number | null> {
    const data = await jolpica(path);
    const total = Number(data?.MRData.total);
    return data && Number.isFinite(total) ? total : null;
}

function tokens(value: string): string[] {
    return value
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^a-z ]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

/** Matches "Kimi ANTONELLI" to Jolpica's "Andrea Kimi Antonelli": all our words must appear. */
export function matchDriverId(fullName: string, pool: JolpicaDriver[]): string | null {
    const ours = tokens(fullName);
    if (ours.length === 0) return null;
    const lastName = ours[ours.length - 1];

    for (const driver of pool) {
        const theirs = new Set(tokens(`${driver.givenName} ${driver.familyName}`));
        if (ours.every((t) => theirs.has(t)) && theirs.has(lastName)) return driver.driverId;
    }
    return null;
}
