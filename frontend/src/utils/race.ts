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

export function getTimeRemaining(targetDate: Date) {
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
    const now = Date.now();

    const upcoming = sessions
        .map((s) => ({
            ...s,
            start: new Date(s.dateStart),
        }))
        .filter((s) => s.start.getTime() > now)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    return upcoming[0] ?? null;
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

export function groupSessionsByDay(sessions: RaceSession[]) {
    return sessions.reduce((acc: Record<string, RaceSession[]>, session) => {
        const date = new Date(session.dateStart).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
        });

        if (!acc[date]) acc[date] = [];
        acc[date].push(session);

        return acc;
    }, {});
}

export function getWeekendLabel(sessions: RaceSession[]) {
    const sorted = [...sessions].sort(
        (a, b) =>
            new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    );

    const start = new Date(sorted[0].dateStart);
    const end = new Date(sorted[sorted.length - 1].dateStart);

    return `${start.toLocaleDateString("en-GB", {
        weekday: "short",
    })} - ${end.toLocaleDateString("en-GB", {
        weekday: "short",
    })}`;
}

export function getSessionStatus(
    sessions: RaceSession[],
    sessionName: string,
    nextSessionName?: string,
) {
    if (!nextSessionName) return "upcoming";

    const order = sessions.findIndex((s) => s.sessionName === sessionName);

    const nextIndex = sessions.findIndex(
        (s) => s.sessionName === nextSessionName,
    );

    if (order < nextIndex) return "done";
    if (order === nextIndex) return "next";
    return "upcoming";
}
