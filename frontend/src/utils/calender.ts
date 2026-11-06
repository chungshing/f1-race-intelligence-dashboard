import { RaceWeekend } from '@/types/race';

const DEFAULT_LENGTH_MS = 60 * 60 * 1000;
const REMINDER = '-PT30M';

function toIcsDate(date: Date) {
    return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
}

function escapeText(value: string) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

// Calendar apps expect lines of at most 75 bytes, continued with a leading space.
function fold(line: string) {
    const parts: string[] = [];
    let rest = line;

    while (rest.length > 74) {
        parts.push(rest.slice(0, 74));
        rest = ` ${rest.slice(74)}`;
    }
    parts.push(rest);

    return parts.join('\r\n');
}

export function isKeySession(sessionName: string) {
    return !sessionName.toLowerCase().includes('practice');
}

export interface IcsOptions {
    keyOnly?: boolean;
    now?: number;
}

/** Calendar file for the sessions of a weekend that haven't finished yet. */
export function buildWeekendIcs(weekend: RaceWeekend, options: IcsOptions = {}): string | null {
    const now = options.now ?? Date.now();

    const sessions = weekend.sessions
        .filter((s) => (options.keyOnly ? isKeySession(s.sessionName) : true))
        .filter((s) => {
            const end = new Date(s.dateEnd).getTime();
            const start = new Date(s.dateStart).getTime();
            return Number.isFinite(start) && (Number.isFinite(end) ? end : start) > now;
        });

    if (sessions.length === 0) return null;

    const stamp = toIcsDate(new Date(now));
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//F1 Pitwall//Race Weekend//EN',
        'CALSCALE:GREGORIAN',
    ];

    for (const session of sessions) {
        const start = new Date(session.dateStart);
        const parsedEnd = new Date(session.dateEnd);
        const end = Number.isNaN(parsedEnd.getTime())
            ? new Date(start.getTime() + DEFAULT_LENGTH_MS)
            : parsedEnd;

        // A fixed id means adding the file again updates the events instead of duplicating them.
        const uid = `${weekend.meetingKey}-${session.sessionName.toLowerCase().replace(/\s+/g, '-')}@f1-pitwall`;
        const title = `F1 ${weekend.country}: ${session.sessionName}`;

        lines.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${stamp}`,
            `DTSTART:${toIcsDate(start)}`,
            `DTEND:${toIcsDate(end)}`,
            `SUMMARY:${escapeText(title)}`,
            `LOCATION:${escapeText(`${weekend.circuit}, ${weekend.country}`)}`,
            `DESCRIPTION:${escapeText(`${weekend.year} ${weekend.country} Grand Prix, ${session.sessionName}.`)}`,
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:${escapeText(`${title} starts in 30 minutes`)}`,
            `TRIGGER:${REMINDER}`,
            'END:VALARM',
            'END:VEVENT'
        );
    }

    lines.push('END:VCALENDAR');

    return `${lines.map(fold).join('\r\n')}\r\n`;
}

export function downloadIcs(content: string, name: string) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
