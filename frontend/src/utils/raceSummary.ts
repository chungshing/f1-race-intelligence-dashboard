import { DriverResult, RaceControlEvent, WeatherSnapshot } from '@/types/results';

export interface RaceSummary {
    safetyCars: number;
    virtualSafetyCars: number;
    redFlags: number;
    dnfs: number;
    wet: boolean;
}

export function buildRaceSummary(
    classification: DriverResult[],
    raceControl?: RaceControlEvent[] | null,
    weather?: WeatherSnapshot[] | null
): RaceSummary {
    let safetyCars = 0;
    let virtualSafetyCars = 0;
    let redFlags = 0;

    for (const event of raceControl ?? []) {
        const message = event.message?.toUpperCase() ?? '';

        if (event.category === 'SafetyCar' && message.includes('DEPLOYED')) {
            if (message.includes('VIRTUAL')) virtualSafetyCars++;
            else safetyCars++;
        }

        if (event.flag === 'RED' && (event.scope == null || event.scope === 'Track')) {
            redFlags++;
        }
    }

    return {
        safetyCars,
        virtualSafetyCars,
        redFlags,
        dnfs: classification.filter((d) => d.dnf).length,
        wet: (weather ?? []).some((w) => (w.rainfall ?? 0) > 0),
    };
}
