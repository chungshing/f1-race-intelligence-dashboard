"use client";

import { RaceSession } from "@/types/race";
import { getTimeRemaining } from "@/utils/race";

type Props = {
    session: RaceSession | null;
};

export default function NextRaceStickyBar({ session }: Props) {
    if (!session) return null;

    const timeLeft = getTimeRemaining(new Date(session.dateStart));

    return (
        <div className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-2">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-400">Next Session</p>
                    <p className="text-sm font-semibold text-white">
                        {session.sessionName}
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-xs text-gray-400">Starts in</p>
                    <p className="text-red-400 font-bold text-sm">
                        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                    </p>
                </div>
            </div>
        </div>
    );
}
