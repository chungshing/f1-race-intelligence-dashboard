import { RaceWeekend } from '@/types/race';

export type TitleKind = 'drivers' | 'constructors';

// Max points one entry can take per round (constructors: best two cars).
const MAX_POINTS = {
    drivers: { race: 25, sprint: 8 },
    constructors: { race: 43, sprint: 15 },
};

export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

// Standings lag the session finishing, so a round only counts as done a while after it ends.
const SETTLE_BUFFER_MS = 3 * 60 * 60 * 1000;

export interface RemainingRounds {
    races: number;
    sprints: number;
}

export interface RemainingRound {
    id: string;
    label: string;
    type: 'race' | 'sprint';
}

export interface TitleEntry {
    key: string;
    name: string;
    color: string;
    points: number;
}

export interface TitleContender extends TitleEntry {
    gap: number;
}

export interface TitleFight {
    maxAvailable: number;
    champion: TitleEntry | null;
    contenders: TitleContender[];
    eliminated: number;
}

export function listRemainingRounds(
    weekends: RaceWeekend[],
    now: number = Date.now()
): RemainingRound[] {
    const season = Math.max(0, ...weekends.map((w) => w.year));
    const rounds: RemainingRound[] = [];

    const firstSession = (weekend: RaceWeekend) =>
        Math.min(...weekend.sessions.map((s) => new Date(s.dateStart).getTime()));

    const ordered = weekends
        .filter((w) => w.year === season && (w.sessions?.length ?? 0) > 0)
        .sort((a, b) => firstSession(a) - firstSession(b));

    for (const weekend of ordered) {
        const sessions = [...weekend.sessions].sort(
            (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
        );

        for (const session of sessions) {
            const settledAt = new Date(session.dateEnd).getTime() + SETTLE_BUFFER_MS;
            if (Number.isNaN(settledAt) || settledAt <= now) continue;

            if (session.sessionName === 'Race') {
                rounds.push({
                    id: `${weekend.meetingKey}-race`,
                    label: `${weekend.country} GP`,
                    type: 'race',
                });
            } else if (session.sessionName === 'Sprint') {
                rounds.push({
                    id: `${weekend.meetingKey}-sprint`,
                    label: `${weekend.country} Sprint`,
                    type: 'sprint',
                });
            }
        }
    }

    return rounds;
}

export function countRemainingRounds(
    weekends: RaceWeekend[],
    now: number = Date.now()
): RemainingRounds {
    const rounds = listRemainingRounds(weekends, now);
    return {
        races: rounds.filter((r) => r.type === 'race').length,
        sprints: rounds.filter((r) => r.type === 'sprint').length,
    };
}

export function computeTitleFight(
    entries: TitleEntry[],
    kind: TitleKind,
    remaining: RemainingRounds
): TitleFight | null {
    if (entries.length < 2) return null;

    const sorted = [...entries].sort((a, b) => b.points - a.points);
    const leader = sorted[0];
    const max = MAX_POINTS[kind];
    const maxAvailable = remaining.races * max.race + remaining.sprints * max.sprint;

    // Best case for a challenger: they take every available point, the leader scores nothing.
    // Ties stay alive because the title would be decided on countback.
    const contenders = sorted
        .filter((entry) => entry.points + maxAvailable >= leader.points)
        .map((entry) => ({ ...entry, gap: leader.points - entry.points }));

    return {
        maxAvailable,
        champion: contenders.length === 1 ? leader : null,
        contenders,
        eliminated: sorted.length - contenders.length,
    };
}
