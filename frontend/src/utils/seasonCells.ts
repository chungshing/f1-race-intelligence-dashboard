import { DriverStanding } from '@/types/standing';
import { disambiguateTeamColors } from '@/utils/sessions';

export type Status = 'DSQ' | 'DNF' | 'DNS' | null;

export function statusOf(r: { dsq: boolean; dnf: boolean; dns: boolean }): Status {
    if (r.dsq) return 'DSQ';
    if (r.dnf) return 'DNF';
    if (r.dns) return 'DNS';
    return null;
}

export function positionLabel(position: number | null, status: Status): string {
    if (status) return status;
    if (position === null) return '—';
    return `P${position}`;
}

export function cellTone(position: number | null, status: Status): string {
    if (status) return 'bg-red-500/10 text-red-400';
    if (position === 1) return 'bg-amber-400/15 text-amber-400';
    if (position === 2) return 'bg-zinc-900 text-zinc-300';
    if (position === 3) return 'bg-amber-600/15 text-amber-600';
    if (position !== null && position <= 10) return 'bg-zinc-900 text-zinc-100';
    return 'bg-zinc-900 text-zinc-400';
}

// "Kimi ANTONELLI" -> "ANT"
export function driverCode(driverName: string): string {
    const lastName = driverName.trim().split(/\s+/).pop() ?? driverName;
    return lastName.slice(0, 3).toUpperCase();
}

// Adds the circuit in brackets only when a country hosts more than one round (e.g. two Spain rounds).
export function createRaceNamer<T extends { country: string; circuit: string }>(
    results: T[]
): (r: T) => string {
    const counts = new Map<string, number>();
    results.forEach((r) => counts.set(r.country, (counts.get(r.country) ?? 0) + 1));
    return (r) =>
        (counts.get(r.country) ?? 0) > 1 && r.circuit ? `${r.country} (${r.circuit})` : r.country;
}

// driverNumber -> line/dot colour, with teammates shifted to a lighter shade so they never match.
export function driverColorMap(drivers: DriverStanding[]): Map<number, string> {
    const result = new Map<number, string>();
    disambiguateTeamColors(drivers).forEach((color, driver) =>
        result.set(driver.driverNumber, color)
    );
    return result;
}
