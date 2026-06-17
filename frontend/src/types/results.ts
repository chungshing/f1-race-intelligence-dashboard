export interface DriverResult {
    position: number | null;
    driverNumber: number;
    gapToLeader: string;
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
}

export interface RaceResult {
    sessionKey: number;
    meetingKey: number;
    country: string;
    sessionName: string;
    classification: DriverResult[];
}

export interface SupabaseRaceResultRow {
    session_key: number;
    meeting_key: number;
    country: string;
    session_name: string;
    classification_json: string | DriverResult[];
}
