import { RaceControlEvent } from '@/types/results';

export type EventImportance = 'high' | 'milestone' | 'low';

const HIGH_PRIORITY_FLAGS = ['DOUBLE YELLOW', 'RED'];
const MILESTONE_FLAGS = ['CHEQUERED'];
const HIGH_PRIORITY_KEYWORDS = ['FIA STEWARDS', 'INCIDENT INVOLVING', 'PENALTY'];
const MILESTONE_KEYWORDS = ['SESSION STARTED', 'SESSION FINISHED'];

export function classifyImportance(event: RaceControlEvent): EventImportance {
    if (event.category === 'SafetyCar') return 'high';

    if (event.flag && HIGH_PRIORITY_FLAGS.includes(event.flag)) return 'high';
    if (event.flag && MILESTONE_FLAGS.includes(event.flag)) return 'milestone';

    const message = event.message?.toUpperCase() ?? '';
    if (HIGH_PRIORITY_KEYWORDS.some((kw) => message.includes(kw))) return 'high';
    if (MILESTONE_KEYWORDS.some((kw) => message.includes(kw))) return 'milestone';

    return 'low';
}

export interface SafetyCarWindow {
    startLap: number;
    endLap: number;
}

export function getSafetyCarWindows(events: RaceControlEvent[]): SafetyCarWindow[] {
    const windows: SafetyCarWindow[] = [];
    let openStart: number | null = null;

    const scEvents = events
        .filter((e) => e.category === 'SafetyCar')
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

    for (const event of scEvents) {
        const message = event.message?.toUpperCase() ?? '';
        if (message.includes('DEPLOYED') && event.lapNumber != null) {
            openStart = event.lapNumber;
        } else if (
            message.includes('IN THIS LAP') &&
            openStart !== null &&
            event.lapNumber != null
        ) {
            windows.push({ startLap: openStart, endLap: event.lapNumber });
            openStart = null;
        }
    }

    return windows;
}

export function isLapUnderSafetyCar(lap: number, windows: SafetyCarWindow[]): boolean {
    return windows.some((w) => lap >= w.startLap && lap <= w.endLap);
}