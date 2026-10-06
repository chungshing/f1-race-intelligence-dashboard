import {
    groupByMeeting,
    getChronologicalMeetingOrder,
    pointsFor,
    isSprintSession,
} from '@/lib/racePoints';
import { parseJsonField } from '@/utils/form';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { RaceWeekend } from '@/types/race';
import { formatHexColor, lightenHex } from '@/utils/sessions';

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
                const isSprint = isSprintSession(session.session_name);
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
