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
