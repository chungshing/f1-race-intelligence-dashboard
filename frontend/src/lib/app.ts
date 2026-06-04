import { API_BASE } from "./apiBase";

export async function getStandings() {
    const res = await fetch(`${API_BASE}/api/standings`);

    if (!res.ok) {
        throw new Error("Failed to fetch standings");
    }

    return res.json();
}

export async function getTeamStandings() {
    const res = await fetch(`${API_BASE}/api/teams`);

    if (!res.ok) {
        throw new Error("Failed to fetch teams");
    }

    return res.json();
}

export async function getRaces() {
    const res = await fetch(`${API_BASE}/api/races/weekends?year=2026`);

    if (!res.ok) {
        throw new Error("Failed to fetch races");
    }

    return res.json();
}
