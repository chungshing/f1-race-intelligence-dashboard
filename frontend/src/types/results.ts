export interface DriverResult {
    position: number | null;
    driverNumber: number;
    gapToLeader: number;
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
