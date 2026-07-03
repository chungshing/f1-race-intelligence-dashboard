export interface DriverResult {
    position: number | null;
    driverNumber: number;
    gapToLeader: string;
    formattedDuration: string | string[] | null; // string for race/practice, string[] for qualifying
    dnf: boolean;
    dns: boolean;
    dsq: boolean;
}

export interface PitStop {
    driver_number: number;
    lap_number: number;
    date: string;
    lane_duration: number;
    stop_duration: number;
}

export interface Stint {
    driver_number: number;
    stint_number: number;
    lap_start: number;
    lap_end: number;
    tyre_age_at_start: number;
    compound: string;
}

export interface WeatherSnapshot {
    airTemperature: number | null;
    humidity: number | null;
    pressure: number | null;
    rainfall: number | null;
    trackTemperature: number | null;
    windDirection: number | null;
    windSpeed: number | null;
    date: string | null;
}

export interface RaceResult {
    sessionKey: number;
    meetingKey: number;
    country: string;
    sessionName: string;
    classification: DriverResult[];
    pitStops: PitStop[];
    stints: Stint[];
    weather: WeatherSnapshot[];
}

export interface SupabaseRaceResultRow {
    session_key: number;
    meeting_key: number;
    country: string;
    session_name: string;
    classification_json: string | DriverResult[];
    pit_stops_json?: string | PitStop[];
    stints_json?: string | Stint[];
    weather_json?: string | WeatherSnapshot[];
}
