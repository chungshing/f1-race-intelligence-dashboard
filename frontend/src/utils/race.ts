import { RaceWeekend, RaceSession } from "@/types/race";

export function getNextRaceWeekend(data: RaceWeekend[]) {
    const now = Date.now();

    const upcoming = data
        .map((weekend) => {
            const raceSession = weekend.sessions.find(
                (s) => s.sessionName === "Race",
            );

            const raceDate = raceSession
                ? new Date(raceSession.dateStart)
                : null;

            return {
                ...weekend,
                raceDate,
            };
        })
        .filter((w) => w.raceDate && w.raceDate.getTime() > now)
        .sort((a, b) => a.raceDate!.getTime() - b.raceDate!.getTime());

    return upcoming[0] ?? null;
}

export function calculateDaysLeft(raceDate: Date) {
    const now = Date.now();
    return Math.ceil((raceDate.getTime() - now) / (1000 * 60 * 60 * 24));
}

export function getTimeRemaining(targetDate: Date) {
    const now = Date.now();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0 };
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return { days, hours, minutes };
}

export function getRaceDate(sessionList: RaceSession[]) {
    const race = sessionList.find((s) => s.sessionName === "Race");

    if (!race?.dateStart) return null;

    return new Date(race.dateStart);
}

export function getWeekendRange(sessions: RaceSession[]) {
    if (!sessions.length) {
        return {
            start: new Date(),
            end: new Date(),
        };
    }

    const sorted = [...sessions].sort(
        (a, b) =>
            new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    );

    return {
        start: new Date(sorted[0].dateStart),
        end: new Date(sorted[sorted.length - 1].dateEnd),
    };
}

export function formatWeekendDisplay(start: Date, end: Date) {
    const dateRange = `${start.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
    })} - ${end.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
    })}`;

    const dayRange = `${start.toLocaleDateString("en-GB", {
        weekday: "short",
    })} - ${end.toLocaleDateString("en-GB", {
        weekday: "short",
    })}`;

    return `${dateRange} (${dayRange})`;
}
