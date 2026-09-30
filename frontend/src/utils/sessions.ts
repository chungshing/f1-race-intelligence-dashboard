import { RaceSession } from '@/types/race';

/**
 * Sorts sessions chronologically and identifies the active/upcoming and next sessions
 */
export function getSortedSessionStatus(sessions: RaceSession[]): {
    currentSession: RaceSession | null;
    nextSession: RaceSession | null;
} {
    if (!sessions || sessions.length === 0) {
        return { currentSession: null, nextSession: null };
    }

    // Sort by start date ascending
    const sortedSessions = [...sessions].sort(
        (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
    );

    const now = Date.now();

    // Find the first session that hasn't finished yet (either live now or in the future)
    const activeIndex = sortedSessions.findIndex((session) => {
        const start = new Date(session.dateStart).getTime();
        const end = new Date(session.dateEnd).getTime();

        const isLive = now >= start && now <= end;
        const isFuture = start > now;

        return isLive || isFuture;
    });

    // If all sessions are completely finished, return the last session as current
    if (activeIndex === -1) {
        return {
            currentSession: sortedSessions[sortedSessions.length - 1],
            nextSession: null,
        };
    }

    return {
        currentSession: sortedSessions[activeIndex],
        nextSession: sortedSessions[activeIndex + 1] || null,
    };
}

export function formatHexColor(color: string): string {
    if (!color) return '#cccccc';
    return color.startsWith('#') ? color : `#${color}`;
}

export function lightenHex(hex: string, amount: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);

    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function disambiguateTeamColors<T extends { teamName: string; teamColor: string }>(
    drivers: T[]
): Map<T, string> {
    const teamColorCount = new Map<string, number>();
    const result = new Map<T, string>();

    for (const driver of drivers) {
        const baseColor = formatHexColor(driver.teamColor);
        const occurrence = teamColorCount.get(driver.teamName) ?? 0;
        teamColorCount.set(driver.teamName, occurrence + 1);

        result.set(driver, occurrence === 0 ? baseColor : lightenHex(baseColor, 0.4 * occurrence));
    }

    return result;
}