import { DriverResult, SupabaseRaceResultRow } from '@/types/results';

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

export function pointsFor(result: DriverResult, isSprint: boolean): number {
    if (result.dnf || result.dns || result.dsq) return 0;
    if (!result.position) return 0;

    const table = isSprint ? SPRINT_POINTS : RACE_POINTS;
    return table[result.position - 1] ?? 0;
}

export function groupByMeeting(
    rows: SupabaseRaceResultRow[]
): Map<number, SupabaseRaceResultRow[]> {
    const scoring = rows
        .filter((r) => r.session_name === 'Race' || r.session_name === 'Sprint')
        .sort((a, b) => a.meeting_key - b.meeting_key);

    const byMeeting = new Map<number, SupabaseRaceResultRow[]>();
    for (const row of scoring) {
        const list = byMeeting.get(row.meeting_key) ?? [];
        list.push(row);
        byMeeting.set(row.meeting_key, list);
    }
    return byMeeting;
}
