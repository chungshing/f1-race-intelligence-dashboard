import { API_BASE } from "./apiBase";

export async function getStandings() {
    // next: { revalidate: 300 } caches data for 5 minutes (300 seconds)
    const res = await fetch(`${API_BASE}/api/standings`, {
        next: { revalidate: 300 },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch standings");
    }

    return res.json();
}

export async function getTeamStandings() {
    const res = await fetch(`${API_BASE}/api/teams`, {
        next: { revalidate: 300 },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch teams");
    }

    return res.json();
}

export async function getRaces() {
    const res = await fetch(`${API_BASE}/api/races/weekends?year=2026`, {
        // Cache race calendars longer (e.g., 24 hours / 86400 seconds) since schedules rarely change
        next: { revalidate: 86400 },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch races");
    }

    return res.json();
}
