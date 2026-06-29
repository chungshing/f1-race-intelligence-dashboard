export interface SupabaseLapRow {
    session_key: number;
    driver_number: number;
    lap_number: number;
    meeting_key: number;
    date_start: string | null;
    duration_sector1: number | null; 
    duration_sector2: number | null;
    duration_sector3: number | null;
    lap_duration: number | null;
    i1_speed: number | null;
    i2_speed: number | null;
    st_speed: number | null;
    is_pit_out_lap: boolean;
    segments_sector_1: string | number[];
    segments_sector_2: string | number[];
    segments_sector_3: string | number[];
}

export interface ChartLapData {
    lap: number;
    [driverNumber: string]: number | null; 
}