"use client";

import { useTeamStandings } from "@/hooks/useTeamStandings";
import { Team } from "@/types/shared";

export default function TeamTable() {
    const { data: teams = [] as Team[], loading, error } = useTeamStandings();

    if (loading) return <div className="text-white">Loading teams...</div>;
    if (error) return <div className="text-red-400">{error}</div>;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white text-xl font-semibold mb-4">
                Constructors Championship
            </h3>

            <table className="w-full text-left">
                <thead className="text-zinc-400 text-xs uppercase">
                    <tr>
                        <th className="p-4">Pos</th>
                        <th className="p-4">Team</th>
                        <th className="p-4 text-right">Points</th>
                    </tr>
                </thead>

                <tbody>
                    {teams.map((team) => (
                        <tr
                            key={team.position}
                            className="border-t border-zinc-800"
                        >
                            <td className="p-4 text-zinc-300">
                                P{team.position}
                            </td>

                            <td className="p-4 text-white font-medium">
                                {team.teamName}
                            </td>

                            <td className="p-4 text-right text-red-400 font-semibold">
                                {team.points}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}