import { Team } from "@/types/shared";

interface TeamTableProps {
    standings: Team[];
    limit?: number; // Optional prop to limit rows
}

export function TeamTable({ standings, limit }: TeamTableProps) {
    if (standings.length === 0)
        return (
            <p className="text-sm text-zinc-400 p-4 border border-zinc-800 rounded-lg bg-zinc-950">
                No constructor data available.
            </p>
        );

    // Slice the data if a limit is provided
    const displayedStandings = limit ? standings.slice(0, limit) : standings;

    return (
        <div className="border border-zinc-800 rounded-xl overflow-x-auto bg-linear-to-b from-zinc-900 to-zinc-950 shadow-2xl">
            <table className="w-full text-left border-collapse text-sm min-w-125">
                <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                        <th className="p-4 w-16 text-center">Pos</th>
                        <th className="p-4">Team</th>
                        <th className="p-4 text-center w-24">Change</th>
                        <th className="p-4 text-right w-28">Points</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                    {displayedStandings.map((row, index) => {
                        const rowKey = row.teamName
                            ? `team-${row.teamName}`
                            : `team-${index}`;

                        const posColor = 
                            row.position === 1 ? "text-amber-400" :
                            row.position === 2 ? "text-zinc-300" :
                            row.position === 3 ? "text-amber-600" : "text-zinc-100";

                        return (
                            <tr
                                key={rowKey}
                                className="group hover:bg-zinc-800/20 transition-all duration-150"
                            >
                                <td className={`p-4 font-black text-center text-base ${posColor}`}>
                                    {row.position}
                                </td>
                                <td className="p-4 font-bold text-zinc-100 tracking-tight text-sm">
                                    {row.teamName}
                                </td>
                                <td className="p-4 text-center">
                                    {row.positionsGained > 0 ? (
                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            ▲ {row.positionsGained}
                                        </span>
                                    ) : row.positionsGained < 0 ? (
                                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                            ▼ {Math.abs(row.positionsGained)}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-600 font-bold font-mono">--</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex flex-col items-end justify-center">
                                        <span className="font-bold text-zinc-100 text-sm tracking-tight">
                                            {row.points}
                                        </span>
                                        {row.pointsEarned > 0 && (
                                            <span className="text-[10px] font-bold text-emerald-400 mt-0.5 bg-emerald-500/10 px-1 rounded">
                                                +{row.pointsEarned}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}