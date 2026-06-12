import { DriverResult } from "@/types/results"; // Your DTO interface

interface Props {
    classification: DriverResult[];
    lookup: Record<number, { name: string; team: string; team_color: string }>;
}

export const RaceResultsTable = ({ classification, lookup }: Props) => {
    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-900/50 text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-800">
                    <tr>
                        <th className="w-1"></th>
                        <th className="p-4">Pos</th>
                        <th className="p-4">Driver</th>
                        <th className="p-4">Team</th>
                        <th className="p-4 text-right">Gap</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                    {classification.map((r) => {
                        const info = lookup[r.driverNumber] || {
                            name: `Driver ${r.driverNumber}`,
                            team: "Unknown",
                            team_color: "#3f3f46",
                        };

                        return (
                            <tr
                                key={r.driverNumber}
                                className="hover:bg-zinc-900/50 transition-colors group relative"
                            >
                                {/* Color strip: using absolute positioning ensures it spans the full row height */}
                                <td className="p-0">
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1"
                                        style={{
                                            backgroundColor: info.team_color,
                                        }}
                                    />
                                </td>

                                <td className="p-4 font-black font-mono text-zinc-100">
                                    {r.dsq ? (
                                        <span className="text-red-500">
                                            DSQ
                                        </span>
                                    ) : r.dnf ? (
                                        <span className="text-zinc-500">
                                            DNF
                                        </span>
                                    ) : r.dns ? (
                                        <span className="text-amber-500">
                                            DNS
                                        </span>
                                    ) : (
                                        r.position || "-"
                                    )}
                                </td>

                                <td className="p-4">
                                    <div className="font-semibold text-zinc-200">
                                        {info.name}
                                    </div>
                                </td>

                                <td className="p-4 text-zinc-500 text-xs tracking-tight">
                                    {info.team}
                                </td>

                                <td className="p-4 text-right font-mono text-zinc-400 tabular-nums">
                                    {r.dsq
                                        ? "DSQ"
                                        : r.dns
                                          ? "DNS"
                                          : r.dnf
                                            ? "DNF"
                                            : r.position === 1
                                              ? "Winner"
                                              : r.gapToLeader != null
                                                ? `+${r.gapToLeader.toFixed(3)}`
                                                : "-"}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
