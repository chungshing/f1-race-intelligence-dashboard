export interface DriverStanding {
    driverNumber: number;
    position: number;
    driverName: string;
    teamName: string;
    points: number;
    teamColor: string;
    headshotUrl: string | null;
}

export interface Team {
    position: number;
    teamName: string;
    points: number;
}