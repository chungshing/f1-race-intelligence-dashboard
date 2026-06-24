// Represents the snake_case database layout directly from Supabase
export interface SupabaseLapRow {
    session_key: number;
    driver_number: number;
    lap_number: number;
    meeting_key: number;
    date_start: string | null;
    duration_sector_1: number | null;
    duration_sector_2: number | null;
    duration_sector_3: number | null;
    lap_duration: number | null;
    i1_speed: number | null;
    i2_speed: number | null;
    st_speed: number | null;
    is_pit_out_lap: boolean;
    // Stored as JSON strings/text arrays in Supabase
    segments_sector_1: string | number[];
    segments_sector_2: string | number[];
    segments_sector_3: string | number[];
}

// Represents the flattened structure Recharts needs: [{ lap: 1, "1": 92.4, "4": 91.8 }]
export interface ChartLapData {
    lap: number;
    [driverNumber: string]: number | null; // Dynamic driver number keys mapping to their lap times
}
