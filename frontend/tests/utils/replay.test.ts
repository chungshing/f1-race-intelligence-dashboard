import type { SupabaseLapRow } from '@/types/laps';
import type { RaceControlEvent } from '@/types/results';
import { buildReplay } from '@/utils/replay';
import { describe, expect, it } from 'vitest';

const START = Date.parse('2026-06-01T12:00:00Z');

// One driver's laps, each starting when the previous one ended.
function laps(driver: number, durations: number[]): SupabaseLapRow[] {
    let clock = START;
    return durations.map((duration, i) => {
        const row: SupabaseLapRow = {
            session_key: 1,
            driver_number: driver,
            lap_number: i + 1,
            meeting_key: 1,
            date_start: new Date(clock).toISOString(),
            duration_sector1: null,
            duration_sector2: null,
            duration_sector3: null,
            lap_duration: duration,
            i1_speed: null,
            i2_speed: null,
            st_speed: null,
            is_pit_out_lap: false,
            segments_sector_1: [],
            segments_sector_2: [],
            segments_sector_3: [],
        };
        clock += duration * 1000;
        return row;
    });
}

const safetyCar = (message: string, lapNumber: number, date: string): RaceControlEvent => ({
    category: 'SafetyCar',
    date,
    driverNumber: null,
    flag: null,
    lapNumber,
    message,
    qualifyingPhase: null,
    scope: null,
    sector: null,
});

// Driver 1 is the quickest but starts second. Driver 3 is slowest and retires after lap 3.
const rawLaps = [
    ...laps(1, [90, 90, 90, 90, 90]),
    ...laps(2, [91, 91, 91, 91, 91]),
    ...laps(3, [92, 92, 92]),
];
const grid = [
    { driverNumber: 2, position: 1 },
    { driverNumber: 1, position: 2 },
    { driverNumber: 3, position: 3 },
];

describe('buildReplay', () => {
    const replay = buildReplay(rawLaps, grid, [], [], [], new Set([3]));

    it('has the winner leading the final lap', () => {
        const final = replay.frames[replay.maxLap];
        expect(final.drivers[0].driverNumber).toBe(1);
        expect(final.drivers[0].position).toBe(1);
    });

    it('records places gained when the quicker car gets through', () => {
        const quick = replay.frames[1].drivers.find((d) => d.driverNumber === 1)!;
        expect(quick.position).toBe(1);
        expect(quick.positionChange).toBe(1);
    });

    it('marks a retired driver as out once they stop completing laps', () => {
        const before = replay.frames[3].drivers.find((d) => d.driverNumber === 3)!;
        const after = replay.frames[4].drivers.find((d) => d.driverNumber === 3)!;
        expect(before.out).toBe(false);
        expect(after.out).toBe(true);
    });
});

describe('buildReplay: safety car', () => {
    it('marks the laps under the safety car and no others', () => {
        const replay = buildReplay(
            rawLaps,
            grid,
            [],
            [],
            [
                safetyCar('SAFETY CAR DEPLOYED', 2, '2026-06-01T12:03:00'),
                safetyCar('SAFETY CAR IN THIS LAP', 3, '2026-06-01T12:04:30'),
            ],
            new Set([3])
        );

        expect(replay.frames.map((f) => f.status)).toEqual([
            'green',
            'green',
            'SC',
            'SC',
            'green',
            'green',
        ]);
    });
});
