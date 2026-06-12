import { RaceSession } from "@/types/race";

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
        (a, b) =>
            new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
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

/**
 * Ensures hex colors are correctly prefixed for CSS styles
 */
export function formatHexColor(color: string): string {
    if (!color) return "#cccccc";
    return color.startsWith("#") ? color : `#${color}`;
}
