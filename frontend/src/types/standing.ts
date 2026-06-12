export interface DriverStanding {
    driverNumber: number;
    position: number;
    positionStart: number;
    positionsGained: number;
    driverName: string;
    teamName: string;
    points: number;
    pointsStart: number;
    pointsEarned: number;
    teamColor: string;
    headshotUrl: string | null;
}

export interface Team {
    teamName: string;
    position: number;
    positionStart: number;
    positionsGained: number;
    points: number;
    pointsStart: number;
    pointsEarned: number;
}

export interface RawDriverStanding {
    driver_number: number | string;
    position: number | string;
    position_start?: number | string | null;
    positions_gained?: number | string | null;
    driver_name?: string | null;
    team_name?: string | null;
    points?: number | string | null;
    points_start?: number | string | null;
    points_earned?: number | string | null;
    team_color?: string | null;
    headshot_url?: string | null;
}

export interface RawTeamStanding {
    team_name?: string | null;
    position: number | string;
    position_start?: number | string | null;
    positions_gained?: number | string | null;
    points?: number | string | null;
    points_start?: number | string | null;
    points_earned?: number | string | null;
}
