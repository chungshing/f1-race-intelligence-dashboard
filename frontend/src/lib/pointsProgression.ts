import { getChronologicalMeetingOrder, groupByMeeting, pointsFor } from '@/lib/racePoints';
import { RaceWeekend } from '@/types/race';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';
import { formatHexColor } from '@/utils/sessions';

export interface PointsProgressionSeries {
    driverNumber: number;
    driverName: string;
    teamColor: string;
}

export interface PointsProgressionPoint {
    round: number;
    country: string;
    [driverKey: string]: number | string;
}

function lightenHex(hex: string, amount: number): string {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);

    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function buildPointsProgression(
    topDriversInput: DriverStanding[],
    raceRows: SupabaseRaceResultRow[],
    weekends: RaceWeekend[]
): { series: PointsProgressionSeries[]; points: PointsProgressionPoint[] } {
    const topDrivers = [...topDriversInput].sort((a, b) => b.points - a.points);

    const byMeeting = groupByMeeting(raceRows);
    const meetingOrder = getChronologicalMeetingOrder(weekends);

    const teamColorCount = new Map<string, number>();
    const series: PointsProgressionSeries[] = topDrivers.map((d) => {
        const baseColor = formatHexColor(d.teamColor);
        const occurrence = teamColorCount.get(d.teamName) ?? 0;
        teamColorCount.set(d.teamName, occurrence + 1);

        const color = occurrence === 0 ? baseColor : lightenHex(baseColor, 0.4 * occurrence);

        return {
            driverNumber: d.driverNumber,
            driverName: d.driverName,
            teamColor: color,
        };
    });

    const cumulative = new Map<number, number>(topDrivers.map((d) => [d.driverNumber, 0]));
    const points: PointsProgressionPoint[] = [];
    let round = 0;

    for (const meetingKey of meetingOrder) {
        const sessions = byMeeting.get(meetingKey);
        if (!sessions) continue;

        const raceSession = sessions.find((r) => r.session_name === 'Race');
        if (!raceSession) continue;

        round++;
        const point: PointsProgressionPoint = { round, country: raceSession.country };

        for (const driver of topDrivers) {
            let roundPoints = 0;
            for (const session of sessions) {
                const isSprint = session.session_name === 'Sprint';
                const classification = parseJsonField<DriverResult>(session.classification_json);
                const entry = classification.find((c) => c.driverNumber === driver.driverNumber);
                if (entry) roundPoints += pointsFor(entry, isSprint);
            }

            const updated = (cumulative.get(driver.driverNumber) ?? 0) + roundPoints;
            cumulative.set(driver.driverNumber, updated);
            point[`driver_${driver.driverNumber}`] = updated;
        }

        points.push(point);
    }

    return { series, points };
}
