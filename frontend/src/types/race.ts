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
    circuitImage: string;
    countryFlag: string;
    circuitType: string;
    sessions: RaceSession[];
}

export interface SupabaseRaceRow {
    meeting_key: number;
    circuit: string;
    country: string;
    year: number;
    circuit_image: string;
    country_flag: string;
    circuit_type: string;
    sessions_json: string;
}