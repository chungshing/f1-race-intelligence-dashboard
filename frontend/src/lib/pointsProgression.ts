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

export function buildPointsProgression(
    topDrivers: DriverStanding[],
    raceRows: SupabaseRaceResultRow[],
    weekends: RaceWeekend[]
): { series: PointsProgressionSeries[]; points: PointsProgressionPoint[] } {
    const byMeeting = groupByMeeting(raceRows);
    const meetingOrder = getChronologicalMeetingOrder(weekends);

    const series: PointsProgressionSeries[] = topDrivers.map((d) => ({
        driverNumber: d.driverNumber,
        driverName: d.driverName,
        teamColor: formatHexColor(d.teamColor),
    }));

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
