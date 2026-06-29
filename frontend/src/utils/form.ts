import { DriverResult, SupabaseRaceResultRow } from '@/types/results';

export interface DriverFormEntry {
    driverNumber: number;
    results: (number | 'DNF' | 'DNS' | 'DSQ' | null)[];
}

export interface PodiumEntry {
    position: 1 | 2 | 3;
    driverNumber: number;
    gapToLeader: string;
}

const parseClassification = (raw: string | DriverResult[]): DriverResult[] => {
    if (!raw) return [];
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }
    return raw;
};

export function buildPodium(raceRows: SupabaseRaceResultRow[]): PodiumEntry[] {
    const mainRace = raceRows
        .filter((r) => r.session_name === 'Race')
        .sort((a, b) => b.meeting_key - a.meeting_key)[0];

    if (!mainRace) return [];

    const classification = parseClassification(mainRace.classification_json);

    return classification
        .filter((d) => d.position && [1, 2, 3].includes(d.position))
        .map((d) => ({
            position: d.position as 1 | 2 | 3,
            driverNumber: d.driverNumber,
            gapToLeader: d.gapToLeader,
        }))
        .sort((a, b) => a.position - b.position);
}

export function buildRecentForm(
    allRaceRows: SupabaseRaceResultRow[],
    driverNumbers: number[],
    limit = 5,
): DriverFormEntry[] {
    const racesSorted = allRaceRows
        .filter((r) => r.session_name === 'Race')
        .sort((a, b) => b.meeting_key - a.meeting_key)
        .slice(0, limit)
        .reverse(); // oldest → newest left to right

    return driverNumbers.map((driverNumber) => ({
        driverNumber,
        results: racesSorted.map((race) => {
            const classification = parseClassification(race.classification_json);
            const entry = classification.find((d) => d.driverNumber === driverNumber);
            if (!entry) return null;
            if (entry.dnf) return 'DNF';
            if (entry.dns) return 'DNS';
            if (entry.dsq) return 'DSQ';
            return entry.position;
        }),
    }));
}
