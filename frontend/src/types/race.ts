export interface RaceSession {
    sessionName: string;
    sessionType: string;
    dateStart: string;
    dateEnd: string;
}

export interface RaceWeekend {
    meetingKey: number;
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

export interface SupabaseRaceRow {
    meeting_key: number;
    circuit: string;
    country: string;
    year: number;
    sessions_json: string;
}
