import { groupByMeeting, isSprintSession } from '@/lib/racePoints';
import { DriverResult, SupabaseRaceResultRow } from '@/types/results';
import { DriverStanding } from '@/types/standing';
import { parseJsonField } from '@/utils/form';

export type CellStatus = 'DNF' | 'DNS' | 'DSQ';

export interface MatrixCell {
    position: number | null;
    status: CellStatus | null;
    sprintPosition: number | null;
    sprintStatus: CellStatus | null;
    tookPartInSprint: boolean;
}

export interface MatrixRound {
    meetingKey: number;
    country: string;
    round: number;
    hasSprint: boolean;
}

export interface MatrixRow {
    driverNumber: number;
    name: string;
    teamName: string;
    teamColor: string;
    points: number;
    cells: (MatrixCell | null)[];
}

export interface ResultsMatrix {
    rounds: MatrixRound[];
    rows: MatrixRow[];
}

function statusOf(entry: DriverResult): CellStatus | null {
    if (entry.dsq) return 'DSQ';
    if (entry.dnf) return 'DNF';
    if (entry.dns) return 'DNS';
    return null;
}

export function buildResultsMatrix(
    rawRows: SupabaseRaceResultRow[],
    drivers: DriverStanding[],
    meetingOrder: number[]
): ResultsMatrix {
    const byMeeting = groupByMeeting(rawRows);

    const rounds: MatrixRound[] = [];
    const raceByRound: DriverResult[][] = [];
    const sprintByRound: DriverResult[][] = [];

    for (const meetingKey of meetingOrder) {
        const sessions = byMeeting.get(meetingKey);
        if (!sessions) continue;

        const raceSession = sessions.find((r) => r.session_name === 'Race');
        if (!raceSession) continue;

        const race = parseJsonField<DriverResult>(raceSession.classification_json);
        if (race.length === 0) continue;

        const sprintSession = sessions.find((r) => isSprintSession(r.session_name));
        const sprint = sprintSession
            ? parseJsonField<DriverResult>(sprintSession.classification_json)
            : [];

        rounds.push({
            meetingKey,
            country: raceSession.country,
            round: rounds.length + 1,
            hasSprint: sprint.length > 0,
        });
        raceByRound.push(race);
        sprintByRound.push(sprint);
    }

    const rows: MatrixRow[] = drivers
        .map((driver) => {
            const cells = rounds.map((_, index): MatrixCell | null => {
                const entry = raceByRound[index].find(
                    (r) => r.driverNumber === driver.driverNumber
                );
                if (!entry) return null;

                const sprintEntry = sprintByRound[index].find(
                    (r) => r.driverNumber === driver.driverNumber
                );

                return {
                    position: entry.position,
                    status: statusOf(entry),
                    sprintPosition: sprintEntry?.position ?? null,
                    sprintStatus: sprintEntry ? statusOf(sprintEntry) : null,
                    tookPartInSprint: !!sprintEntry,
                };
            });

            return {
                driverNumber: driver.driverNumber,
                name: driver.driverName,
                teamName: driver.teamName,
                teamColor: driver.teamColor,
                points: driver.points,
                cells,
            };
        })
        .filter((row) => row.cells.some((cell) => cell != null));

    return { rounds, rows };
}
