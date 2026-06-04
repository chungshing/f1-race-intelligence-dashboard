export interface RaceSession {
    sessionName: string;
    sessionType: string;
    dateStart: string;
    dateEnd: string;
}

export interface RaceWeekend {
    meetingKey: number;
    country: string;
    circuit: string;
    sessions: RaceSession[];
}
