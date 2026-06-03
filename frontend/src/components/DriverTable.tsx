"use client";

//import { useLiveData } from '@/hook/useLiveData(mock)';
import { useStandings } from "@/hooks/useStandings";
import Image from "next/image";
import { DriverStanding } from "@/types/shared";

function getPositionColor(pos: number) {
    if (pos === 1) return "text-yellow-400";
    if (pos === 2) return "text-zinc-300";
    if (pos === 3) return "text-orange-400";
    return "text-zinc-400";
}

export default function DriverTable() {
    const { data: standings = [] as DriverStanding[], loading, error } = useStandings();
    if (loading) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white">
                Loading standings...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-red-400">
                {error}
            </div>
        );
    }
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                    Driver Standings
                </h3>

                <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-black font-bold">
                    LIVE
                </span>
            </div>

            {/* Table */}
            <table className="w-full text-left">
                <thead className="bg-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="p-4">Pos</th>
                        <th className="p-4">Driver</th>
                        <th className="p-4">Team</th>
                        <th className="p-4 text-right">Points</th>
                    </tr>
                </thead>

                <tbody>
                    {standings.map((driver) => (
                        <tr
                            key={driver.position}
                            className="border-t border-zinc-800 hover:bg-zinc-800/60 transition"
                            style={{
                                borderLeft: `4px solid #${driver.teamColor}`,
                            }}
                        >
                            {/* Position */}
                            <td
                                className={`p-4 font-bold ${getPositionColor(driver.position)}`}
                            >
                                P{driver.position}
                            </td>

                            {/* Driver */}
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-zinc-400 font-mono w-8">
                                        #{driver.driverNumber}
                                    </span>

                                    {driver.headshotUrl ? (
                                        <Image
                                            src={driver.headshotUrl}
                                            alt={driver.driverName}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-700" />
                                    )}

                                    <span className="text-white font-medium">
                                        {driver.driverName}
                                    </span>
                                </div>
                            </td>

                            {/* Team */}
                            <td
                                className="p-4 font-medium"
                                style={{
                                    color: `#${driver.teamColor}`,
                                }}
                            >
                                {driver.teamName}
                            </td>

                            {/* Points */}
                            <td className="p-4 text-right font-semibold text-red-400">
                                {driver.points}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
