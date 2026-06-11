export interface RaceSession {
    sessionName: string;
    sessionType: string;
    dateStart: string;
    dateEnd: string;
}

export interface RaceWeekend {
    meeting_key: number;
    circuit: string;
    country: string;
    year: number;
    sessions: {
        sessionName: string;
        sessionType: string;
        dateStart: string;
        dateEnd: string;
    }[];
}
