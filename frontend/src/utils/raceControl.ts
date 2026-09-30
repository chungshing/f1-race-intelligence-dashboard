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
