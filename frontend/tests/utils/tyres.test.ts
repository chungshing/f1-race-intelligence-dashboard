import type { SupabaseLapRow } from '@/types/laps';
import type { Stint } from '@/types/results';
import { buildTyreDegradation } from '@/utils/tyres';
import { describe, expect, it } from 'vitest';

const lap = (driver: number, lapNumber: number, duration: number): SupabaseLapRow => ({
    session_key: 1,
    driver_number: driver,
    lap_number: lapNumber,
    meeting_key: 1,
    date_start: null,
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
});

const stint = (driver: number, compound: string, start: number, end: number): Stint => ({
    driver_number: driver,
    stint_number: 1,
    lap_start: start,
    lap_end: end,
    tyre_age_at_start: 0,
    compound,
});

// Drivers 1-3 run softs that lose 0.1s a lap, drivers 4-6 run hards that stay flat.
function race() {
    const laps: SupabaseLapRow[] = [];
    const stints: Stint[] = [];

    for (const driver of [1, 2, 3]) {
        stints.push(stint(driver, 'SOFT', 1, 20));
        for (let n = 1; n <= 20; n++) laps.push(lap(driver, n, 90 + 0.1 * n));
    }
    for (const driver of [4, 5, 6]) {
        stints.push(stint(driver, 'HARD', 1, 20));
        for (let n = 1; n <= 20; n++) laps.push(lap(driver, n, 91));
    }
    return { laps, stints };
}

describe('buildTyreDegradation', () => {
    it('shows the softs losing more time per lap than the hards', () => {
        const { laps, stints } = race();
        const { summaries } = buildTyreDegradation(stints, laps, []);

        const soft = summaries.find((s) => s.compound === 'SOFT')!;
        const hard = summaries.find((s) => s.compound === 'HARD')!;
        expect(soft.stints).toBe(3);
        expect(soft.degPerLap).toBeGreaterThan(hard.degPerLap);
    });

    it('skips a stint with fewer than four clean laps', () => {
        const { laps, stints } = race();
        stints.push(stint(7, 'MEDIUM', 1, 4));
        for (let n = 1; n <= 4; n++) laps.push(lap(7, n, 92));

        expect(buildTyreDegradation(stints, laps, []).compounds).not.toContain('MEDIUM');
    });

    it('ignores changes that hit the whole field, like fuel burn or a drying track', () => {
        const laps: SupabaseLapRow[] = [];
        const stints: Stint[] = [];
        // Every car is on softs and every lap time falls by the same amount.
        for (const driver of [1, 2, 3, 4, 5, 6]) {
            stints.push(stint(driver, 'SOFT', 1, 20));
            for (let n = 1; n <= 20; n++) laps.push(lap(driver, n, 95 - 0.1 * n));
        }

        const { summaries } = buildTyreDegradation(stints, laps, []);
        expect(Math.abs(summaries[0].degPerLap)).toBeLessThan(0.01);
    });
});
