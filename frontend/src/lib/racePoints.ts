import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { RaceWeekend } from '@/types/race';

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

export function pointsFor(result: DriverResult, isSprint: boolean): number {
    if (result.dnf || result.dns || result.dsq) return 0;
    if (!result.position) return 0;

    const table = isSprint ? SPRINT_POINTS : RACE_POINTS;
    return table[result.position - 1] ?? 0;
}

export function isSprintSession(sessionName: string): boolean {
    const n = sessionName?.toLowerCase() ?? '';
    return n === 'sprint' || n === 'sprint race';
}

export function groupByMeeting(
    rows: SupabaseRaceResultRow[]
): Map<number, SupabaseRaceResultRow[]> {
    const scoring = rows.filter(
        (r) => r.session_name === 'Race' || isSprintSession(r.session_name)
    );

    const byMeeting = new Map<number, SupabaseRaceResultRow[]>();
    for (const row of scoring) {
        const list = byMeeting.get(row.meeting_key) ?? [];
        list.push(row);
        byMeeting.set(row.meeting_key, list);
    }
    return byMeeting;
}

export function getChronologicalMeetingOrder(weekends: RaceWeekend[]): number[] {
    return [...weekends]
        .map((w) => ({
            meetingKey: w.meetingKey,
            startTime: Math.min(...w.sessions.map((s) => new Date(s.dateStart).getTime())),
        }))
        .sort((a, b) => a.startTime - b.startTime)
        .map((w) => w.meetingKey);
}
