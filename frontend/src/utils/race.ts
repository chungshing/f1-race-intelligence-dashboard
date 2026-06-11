import { RaceWeekend, RaceSession } from "@/types/race";

export function getNextRaceWeekend(data: RaceWeekend[]) {
    if (!data || !data.length) return null;
    const now = Date.now();

    const upcoming = data
        .map((weekend) => {
            if (!weekend || !weekend.sessions)
                return { ...weekend, raceDate: null };
            const raceSession = weekend.sessions.find(
                (s) => s.sessionName === "Race",
            );
            const raceDate = raceSession
                ? new Date(raceSession.dateStart)
                : null;
            return { ...weekend, raceDate };
        })
        .filter((w) => w.raceDate && w.raceDate.getTime() > now)
        .sort((a, b) => a.raceDate!.getTime() - b.raceDate!.getTime());

    return upcoming[0] ?? null;
}

export function getTimeRemaining(targetDate: Date) {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0 };
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

    const totalMinutes = Math.floor(diff / (1000 * 60));
    return {
        days: Math.floor(totalMinutes / (60 * 24)),
        hours: Math.floor((totalMinutes % (60 * 24)) / 60),
        minutes: totalMinutes % 60,
    };
}

export function getNextSession(sessions: RaceSession[]) {
    if (!sessions || !sessions.length) return null;
    const now = Date.now();

    return (
        [...sessions]
            .map((s) => ({ ...s, start: new Date(s.dateStart) }))
            .filter((s) => s.start.getTime() > now)
            .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null
    );
}

export function getWeekendLabel(sessions: RaceSession[]) {
    if (!sessions || !sessions.length) return "N/A";
    const sorted = [...sessions].sort(
        (a, b) =>
            new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    );
    const start = new Date(sorted[0].dateStart);
    const end = new Date(sorted[sorted.length - 1].dateStart);

    return `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
}

export function getSessionStatus(
    sessions: RaceSession[],
    currentSessionStart: string,
    nextSessionStart?: string,
) {
    if (!nextSessionStart) return "upcoming";

    const now = Date.now();
    const sessionTime = new Date(currentSessionStart).getTime();

    if (sessionTime < now) return "done";
    if (currentSessionStart === nextSessionStart) return "next";
    return "upcoming";
}

export function isWeekendActive(weekend: RaceWeekend) {
    if (!weekend || !weekend.sessions) return false;
    const now = Date.now();

    const sorted = [...weekend.sessions].sort(
        (a, b) =>
            new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    );
    const start = new Date(sorted[0].dateStart).getTime();
    const end =
        new Date(sorted[sorted.length - 1].dateEnd).getTime() + 10800000; // 3h buffer

    return now >= start && now <= end;
}
