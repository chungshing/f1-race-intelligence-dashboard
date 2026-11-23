import { SupabaseLapRow } from '@/types/laps';
import { DriverResult, PitStop, RaceControlEvent, Stint } from '@/types/results';
import { buildReplay } from '@/utils/replay';

type Names = Map<number, { name: string; team: string }>;

interface Input {
    laps: SupabaseLapRow[];
    grid: { driverNumber: number; position: number | null }[];
    stints: Stint[];
    pitStops: PitStop[];
    raceControl: RaceControlEvent[];
    classification: DriverResult[];
    names: Names;
    requested: string;
}

const round = (v: number | null, d = 3) => (v === null ? null : Number(v.toFixed(d)));

function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function buildRaceStory({
    laps,
    grid,
    stints,
    pitStops,
    raceControl,
    classification,
    names,
    requested,
}: Input) {
    const retired = new Set(
        classification.filter((d) => d.dnf || d.dns || d.dsq).map((d) => d.driverNumber)
    );
    const replay = buildReplay(laps, grid, stints, pitStops, raceControl, retired);

    const who = (n: number) => names.get(n)?.name ?? `Driver ${n}`;
    const winner = classification.find((d) => d.position === 1)?.driverNumber ?? null;

    // Resolve requested drivers by name; default to the top three finishers.
    const terms = requested
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    let wanted = classification
        .filter((d) => terms.some((t) => who(d.driverNumber).toLowerCase().includes(t)))
        .map((d) => d.driverNumber);
    if (wanted.length === 0) {
        wanted = classification
            .filter((d) => d.position != null && d.position <= 3)
            .map((d) => d.driverNumber);
    }
    wanted = wanted.slice(0, 4);
    if (winner !== null) wanted = [winner, ...wanted.filter((d) => d !== winner)];

    const lapRows = new Map<number, Map<number, SupabaseLapRow>>();
    for (const row of laps) {
        const byLap = lapRows.get(row.driver_number) ?? new Map<number, SupabaseLapRow>();
        byLap.set(row.lap_number, row);
        lapRows.set(row.driver_number, byLap);
    }

    const pitLaps = new Map<number, Set<number>>();
    for (const stop of pitStops) {
        const set = pitLaps.get(stop.driver_number) ?? new Set<number>();
        set.add(stop.lap_number);
        pitLaps.set(stop.driver_number, set);
    }

    // A clean lap: green flag now and on the previous lap, not a pit in/out lap, not lap 1.
    const cleanTime = (driver: number, lap: number): number | null => {
        if (lap <= 1) return null;
        if (replay.frames[lap]?.status !== 'green' || replay.frames[lap - 1]?.status !== 'green')
            return null;
        if (pitLaps.get(driver)?.has(lap)) return null;
        const row = lapRows.get(driver)?.get(lap);
        if (!row || row.is_pit_out_lap || !row.lap_duration || row.lap_duration <= 0) return null;
        return row.lap_duration;
    };

    const drivers = wanted.map((driver) => {
        const result = classification.find((d) => d.driverNumber === driver);
        const gridPos = grid.find((g) => g.driverNumber === driver)?.position ?? null;

        const stintSummaries = stints
            .filter((s) => s.driver_number === driver)
            .sort((a, b) => a.stint_number - b.stint_number)
            .map((s) => {
                const times: number[] = [];
                const diffs: number[] = [];
                for (let lap = s.lap_start; lap <= s.lap_end; lap++) {
                    const t = cleanTime(driver, lap);
                    if (t === null) continue;
                    times.push(t);
                    if (winner !== null && driver !== winner) {
                        const w = cleanTime(winner, lap);
                        if (w !== null) diffs.push(t - w);
                    }
                }
                const endFrame = replay.frames[Math.min(s.lap_end, replay.maxLap)];
                const endState = endFrame?.drivers.find((d) => d.driverNumber === driver);

                return {
                    compound: s.compound,
                    laps: `${s.lap_start}-${s.lap_end}`,
                    cleanLaps: times.length,
                    medianLapSeconds: round(median(times)),
                    bestLapSeconds: round(times.length ? Math.min(...times) : null),
                    secondsPerLapVsWinner: diffs.length >= 3 ? round(median(diffs)) : null,
                    gapToLeaderAtStintEnd: endState
                        ? endState.lapsDown > 0
                            ? `+${endState.lapsDown} lap(s)`
                            : round(endState.gapSeconds, 1)
                        : null,
                };
            });

        const events = replay.events
            .filter((e) => e.driverNumber === driver)
            .map((e) => ({ lap: e.lap, event: e.text }));

        return {
            driver: who(driver),
            team: names.get(driver)?.team,
            grid: gridPos,
            finish: result?.position ?? null,
            status: result?.dsq ? 'DSQ' : result?.dnf ? 'DNF' : result?.dns ? 'DNS' : 'Finished',
            // index = lap number, 0 is the starting grid
            positionByLap: replay.frames.map(
                (f) => f.drivers.find((d) => d.driverNumber === driver)?.position ?? null
            ),
            stints: stintSummaries,
            events,
        };
    });

    return {
        totalLaps: replay.maxLap,
        winner: winner !== null ? who(winner) : null,
        note: 'Pace figures use clean green-flag laps only; positive secondsPerLapVsWinner means slower than the winner on the same laps. Fuel and tyre-age effects are not corrected.',
        statusWindows: replay.statusWindows,
        raceEvents: replay.events
            .filter((e) => e.driverNumber === undefined)
            .map((e) => ({ lap: e.lap, event: e.text })),
        drivers,
    };
}
