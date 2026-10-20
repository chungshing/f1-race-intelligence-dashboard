import { RaceWeekend } from '@/types/race';

export type TitleKind = 'drivers' | 'constructors';

// Max points one entry can take per round (constructors: best two cars).
const MAX_POINTS = {
    drivers: { race: 25, sprint: 8 },
    constructors: { race: 43, sprint: 15 },
};

// Standings lag the session finishing, so a round only counts as done a while after it ends.
const SETTLE_BUFFER_MS = 3 * 60 * 60 * 1000;

export interface RemainingRounds {
    races: number;
    sprints: number;
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

export function countRemainingRounds(
    weekends: RaceWeekend[],
    now: number = Date.now()
): RemainingRounds {
    const season = Math.max(0, ...weekends.map((w) => w.year));
    let races = 0;
    let sprints = 0;

    for (const weekend of weekends) {
        if (weekend.year !== season) continue;

        for (const session of weekend.sessions ?? []) {
            const settledAt = new Date(session.dateEnd).getTime() + SETTLE_BUFFER_MS;
            if (Number.isNaN(settledAt) || settledAt <= now) continue;

            if (session.sessionName === 'Race') races++;
            else if (session.sessionName === 'Sprint') sprints++;
        }
    }

    return { races, sprints };
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
