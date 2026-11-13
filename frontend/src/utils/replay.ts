import type { SupabaseLapRow } from '@/types/laps';
import type { PitStop, RaceControlEvent, Stint } from '@/types/results';

export type RaceStatus = 'green' | 'SC' | 'VSC' | 'red';

export interface ReplayDriverState {
    driverNumber: number;
    /** null once the driver has retired */
    position: number | null;
    /** Seconds behind the leader (null for the leader, lapped cars and retirements) */
    gapSeconds: number | null;
    /** Whole laps behind the leader */
    lapsDown: number;
    /** Seconds behind the car ahead, when both are on the same lap */
    intervalSeconds: number | null;
    compound: string | null;
    tyreAge: number | null;
    pittedThisLap: boolean;
    lastLap: number | null;
    isFastestSoFar: boolean;
    /** Places gained since the previous lap (negative = lost) */
    positionChange: number;
    out: boolean;
}

export interface ReplayFrame {
    /** 0 is the starting grid */
    lap: number;
    drivers: ReplayDriverState[];
    status: RaceStatus;
    fastestLap: { driverNumber: number; time: number; lap: number } | null;
}

export type ReplayEventKind = 'pit' | 'sc' | 'vsc' | 'red' | 'out';

export interface ReplayEvent {
    lap: number;
    kind: ReplayEventKind;
    driverNumber?: number;
    text: string;
}

export interface StatusWindow {
    start: number;
    end: number;
    kind: 'SC' | 'VSC';
}

export interface Replay {
    frames: ReplayFrame[];
    events: ReplayEvent[];
    statusWindows: StatusWindow[];
    driverNumbers: number[];
    maxLap: number;
}

interface GridLike {
    driverNumber: number;
    position: number | null;
}

function buildStatusWindows(raceControl: RaceControlEvent[]): StatusWindow[] {
    const windows: StatusWindow[] = [];
    let open: { start: number; kind: 'SC' | 'VSC' } | null = null;

    const events = raceControl
        .filter((e) => e.category === 'SafetyCar' && e.lapNumber != null)
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

    for (const event of events) {
        const message = event.message?.toUpperCase() ?? '';
        const lap = event.lapNumber as number;

        if (message.includes('DEPLOYED')) {
            open = { start: lap, kind: message.includes('VIRTUAL') ? 'VSC' : 'SC' };
        } else if (open && (message.includes('IN THIS LAP') || message.includes('ENDING'))) {
            windows.push({ start: open.start, end: lap, kind: open.kind });
            open = null;
        }
    }

    return windows;
}

function compoundAt(stints: Stint[], driver: number, lap: number) {
    const own = stints
        .filter((s) => s.driver_number === driver)
        .sort((a, b) => a.stint_number - b.stint_number);
    if (own.length === 0) return { compound: null, age: null };

    const lapToFind = Math.max(lap, 1);
    const stint =
        own.find((s) => lapToFind >= s.lap_start && lapToFind <= s.lap_end) ??
        (lapToFind < own[0].lap_start ? own[0] : own[own.length - 1]);

    // Age at the end of this lap; on the grid it is the age the tyre starts with.
    const age = lap === 0 ? stint.tyre_age_at_start : stint.tyre_age_at_start + (lap - stint.lap_start) + 1;
    return { compound: stint.compound, age: Math.max(age, 0) };
}

export function buildReplay(
    rawLaps: SupabaseLapRow[],
    grid: GridLike[],
    stints: Stint[],
    pitStops: PitStop[],
    raceControl: RaceControlEvent[],
    retiredDrivers: Set<number>
): Replay {
    const starts = new Map<number, Map<number, number>>();
    const durations = new Map<number, Map<number, number>>();
    const drivers = new Set<number>();
    let maxLap = 0;

    for (const row of rawLaps) {
        if (!row.lap_number) continue;
        drivers.add(row.driver_number);
        maxLap = Math.max(maxLap, row.lap_number);

        if (row.date_start) {
            const time = Date.parse(row.date_start);
            if (!Number.isNaN(time)) {
                if (!starts.has(row.driver_number)) starts.set(row.driver_number, new Map());
                starts.get(row.driver_number)!.set(row.lap_number, time);
            }
        }
        if (row.lap_duration && row.lap_duration > 0) {
            if (!durations.has(row.driver_number)) durations.set(row.driver_number, new Map());
            durations.get(row.driver_number)!.set(row.lap_number, row.lap_duration);
        }
    }

    const endTime = (driver: number, lap: number): number | null => {
        const next = starts.get(driver)?.get(lap + 1);
        if (next != null) return next;

        const start = starts.get(driver)?.get(lap);
        const duration = durations.get(driver)?.get(lap);
        return start != null && duration != null ? start + duration * 1000 : null;
    };

    // Last lap each driver completed, for retirements and lapped cars.
    const lastCompleted = new Map<number, number>();
    for (const driver of drivers) {
        let last = 0;
        for (let lap = 1; lap <= maxLap; lap++) {
            if (endTime(driver, lap) != null) last = lap;
        }
        lastCompleted.set(driver, last);
    }

    const statusWindows = buildStatusWindows(raceControl);
    const redFlagLaps = new Set(
        raceControl.filter((e) => e.flag === 'RED' && e.lapNumber != null).map((e) => e.lapNumber as number)
    );
    const statusAt = (lap: number): RaceStatus => {
        if (redFlagLaps.has(lap)) return 'red';
        const window = statusWindows.find((w) => lap >= w.start && lap <= w.end);
        return window ? window.kind : 'green';
    };

    const pitLapsByDriver = new Map<number, Set<number>>();
    for (const stop of pitStops) {
        const set = pitLapsByDriver.get(stop.driver_number) ?? new Set<number>();
        set.add(stop.lap_number);
        pitLapsByDriver.set(stop.driver_number, set);
    }

    const frames: ReplayFrame[] = [];
    let previousPositions = new Map<number, number>();
    let best: { driverNumber: number; time: number; lap: number } | null = null;

    // ---- Lap 0: the starting grid
    const gridOrder = grid
        .filter((g) => g.position != null && drivers.has(g.driverNumber))
        .sort((a, b) => (a.position as number) - (b.position as number))
        .map((g) => g.driverNumber);
    const rest = [...drivers].filter((d) => !gridOrder.includes(d));
    const startOrder = [...gridOrder, ...rest];

    frames.push({
        lap: 0,
        status: 'green',
        fastestLap: null,
        drivers: startOrder.map((driverNumber, index) => {
            const tyre = compoundAt(stints, driverNumber, 0);
            return {
                driverNumber,
                position: index + 1,
                gapSeconds: null,
                lapsDown: 0,
                intervalSeconds: null,
                compound: tyre.compound,
                tyreAge: tyre.age,
                pittedThisLap: false,
                lastLap: null,
                isFastestSoFar: false,
                positionChange: 0,
                out: false,
            };
        }),
    });
    previousPositions = new Map(startOrder.map((d, i) => [d, i + 1]));

    // ---- Every completed lap
    for (let lap = 1; lap <= maxLap; lap++) {
        const crossings: { driver: number; time: number }[] = [];
        for (const driver of drivers) {
            const time = endTime(driver, lap);
            if (time != null) crossings.push({ driver, time });
        }
        crossings.sort((a, b) => a.time - b.time);

        const leaderTime = crossings[0]?.time ?? 0;
        const leaderLap = crossings[0] ? durations.get(crossings[0].driver)?.get(lap) ?? 0 : 0;

        // New fastest lap of the race so far
        for (const { driver } of crossings) {
            const duration = durations.get(driver)?.get(lap);
            if (duration && (!best || duration < best.time)) {
                best = { driverNumber: driver, time: duration, lap };
            }
        }

        const states: ReplayDriverState[] = [];
        const onTrack = new Set(crossings.map((c) => c.driver));

        crossings.forEach((crossing, index) => {
            const gap = (crossing.time - leaderTime) / 1000;
            const lapsDown = leaderLap > 0 ? Math.floor(gap / leaderLap) : 0;
            const ahead = index > 0 ? crossings[index - 1] : null;
            const aheadGap = ahead ? (ahead.time - leaderTime) / 1000 : 0;
            const aheadLapsDown = leaderLap > 0 ? Math.floor(aheadGap / leaderLap) : 0;
            const tyre = compoundAt(stints, crossing.driver, lap);
            const lastLap = durations.get(crossing.driver)?.get(lap) ?? null;

            states.push({
                driverNumber: crossing.driver,
                position: index + 1,
                gapSeconds: index === 0 || lapsDown > 0 ? null : gap,
                lapsDown,
                intervalSeconds:
                    ahead && lapsDown === aheadLapsDown && lapsDown === 0
                        ? (crossing.time - ahead.time) / 1000
                        : null,
                compound: tyre.compound,
                tyreAge: tyre.age,
                pittedThisLap: pitLapsByDriver.get(crossing.driver)?.has(lap) ?? false,
                lastLap,
                isFastestSoFar:
                    lastLap != null &&
                    best != null &&
                    best.driverNumber === crossing.driver &&
                    best.lap === lap,
                positionChange: 0,
                out: false,
            });
        });

        // Drivers with no crossing yet: lapped cars still running, or retirements.
        const missing = [...drivers]
            .filter((d) => !onTrack.has(d))
            .sort((a, b) => {
                const lapDiff = (lastCompleted.get(b) ?? 0) - (lastCompleted.get(a) ?? 0);
                if (lapDiff !== 0) return lapDiff;
                return (endTime(a, lastCompleted.get(a) ?? 0) ?? 0) - (endTime(b, lastCompleted.get(b) ?? 0) ?? 0);
            });

        const running: ReplayDriverState[] = [];
        const retired: ReplayDriverState[] = [];

        for (const driver of missing) {
            const completed = lastCompleted.get(driver) ?? 0;
            const isOut = retiredDrivers.has(driver) && lap > completed;
            const tyre = compoundAt(stints, driver, Math.min(lap, Math.max(completed, 1)));

            const state: ReplayDriverState = {
                driverNumber: driver,
                position: null,
                gapSeconds: null,
                lapsDown: Math.max(lap - completed, 1),
                intervalSeconds: null,
                compound: tyre.compound,
                tyreAge: tyre.age,
                pittedThisLap: false,
                lastLap: null,
                isFastestSoFar: false,
                positionChange: 0,
                out: isOut,
            };
            (isOut ? retired : running).push(state);
        }

        const ordered = [...states, ...running, ...retired];
        ordered.forEach((state, index) => {
            if (!state.out) state.position = index + 1;
            const previous = previousPositions.get(state.driverNumber);
            state.positionChange = !state.out && previous != null ? previous - (state.position as number) : 0;
        });

        previousPositions = new Map(
            ordered.filter((s) => !s.out).map((s) => [s.driverNumber, s.position as number])
        );

        frames.push({ lap, drivers: ordered, status: statusAt(lap), fastestLap: best ? { ...best } : null });
    }

    // ---- Event feed
    const events: ReplayEvent[] = [];

    for (const stop of pitStops) {
        const next = compoundAt(stints, stop.driver_number, stop.lap_number + 1);
        const duration = stop.stop_duration > 0 ? stop.stop_duration : stop.lane_duration;
        events.push({
            lap: stop.lap_number,
            kind: 'pit',
            driverNumber: stop.driver_number,
            text: `pits${duration > 0 ? ` · ${duration.toFixed(1)}s` : ''}${next.compound ? ` · on ${next.compound.toLowerCase()}s` : ''}`,
        });
    }

    for (const window of statusWindows) {
        const label = window.kind === 'SC' ? 'Safety Car' : 'Virtual Safety Car';
        events.push({ lap: window.start, kind: window.kind === 'SC' ? 'sc' : 'vsc', text: `${label} deployed` });
        events.push({ lap: window.end, kind: window.kind === 'SC' ? 'sc' : 'vsc', text: `${label} ending` });
    }

    for (const lap of redFlagLaps) {
        events.push({ lap, kind: 'red', text: 'Red flag' });
    }

    for (const driver of retiredDrivers) {
        const completed = lastCompleted.get(driver);
        if (completed == null || completed >= maxLap) continue;
        events.push({ lap: completed + 1, kind: 'out', driverNumber: driver, text: 'retires' });
    }

    events.sort((a, b) => a.lap - b.lap);

    return {
        frames,
        events,
        statusWindows,
        driverNumbers: startOrder,
        maxLap,
    };
}