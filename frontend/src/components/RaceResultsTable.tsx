import { DriverResult } from "@/types/results";
import { Trophy, Timer } from "lucide-react";

interface Props {
    classification: DriverResult[];
    lookup: Record<number, { name: string; team: string; team_color: string }>;
    variant?: "default" | "landing";
}

export const RaceResultsTable = ({
    classification,
    lookup,
    variant = "default",
}: Props) => {
    const isLanding = variant === "landing";

    // Normalize and prepare row data to eliminate all downstream logic duplication
    const rows = (isLanding ? classification.slice(0, 3) : classification).map(
        (r) => {
            const info = lookup[r.driverNumber] ?? {
                name: `Driver ${r.driverNumber}`,
                team: "Unknown",
                team_color: "#3f3f46",
            };
            const hasStatus = !!(r.dsq || r.dnf || r.dns);
            const statusText = r.dsq
                ? "DSQ"
                : r.dnf
                  ? "DNF"
                  : r.dns
                    ? "DNS"
                    : "";

            return { r, info, hasStatus, statusText };
        },
    );

    if (isLanding) {
        return (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 backdrop-blur-sm">
                {rows.map(({ r, info }) => (
                    <div
                        key={r.driverNumber}
                        className="flex items-center justify-between text-xs border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0"
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-zinc-500 w-4">
                                {r.position || "-"}
                            </span>
                            <div
                                className="w-1 h-3 rounded-full"
                                style={{ backgroundColor: info.team_color }}
                            />
                            <div>
                                <p className="font-bold text-zinc-200">
                                    {info.name}
                                </p>
                                <p className="text-[10px] text-zinc-500">
                                    {info.team}
                                </p>
                            </div>
                        </div>

                        <div className="text-right font-mono text-zinc-400 text-[11px] flex items-center gap-1.5">
                            {r.position === 1 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                                    <Trophy className="w-3 h-3 fill-amber-400/20" />{" "}
                                    WINNER
                                </span>
                            ) : r.gapToLeader != null ? (
                                <>
                                    <Timer className="w-3 h-3 text-zinc-600" />
                                    <span>+{r.gapToLeader.toFixed(3)}</span>
                                </>
                            ) : (
                                "-"
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-900/50 text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-800">
                    <tr>
                        <th className="p-4 pl-5">Pos</th>
                        <th className="p-4">Driver</th>
                        <th className="p-4">Team</th>
                        <th className="p-4 text-right">Gap</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                    {rows.map(({ r, info, hasStatus, statusText }) => (
                        <tr
                            key={r.driverNumber}
                            className="hover:bg-zinc-900/50 transition-colors group"
                        >
                            <td
                                className="p-4 pl-5 font-black font-mono tracking-tight transition-all"
                                style={{
                                    borderLeft: `4px solid ${info.team_color}`,
                                }}
                            >
                                {hasStatus ? (
                                    <span
                                        className={
                                            r.dsq
                                                ? "text-red-500"
                                                : r.dnf
                                                  ? "text-zinc-500"
                                                  : "text-amber-500"
                                        }
                                    >
                                        {statusText}
                                    </span>
                                ) : (
                                    r.position || "-"
                                )}
                            </td>
                            <td className="p-4 font-semibold text-zinc-200">
                                {info.name}
                            </td>
                            <td className="p-4 text-zinc-500 text-xs tracking-tight">
                                {info.team}
                            </td>
                            <td className="p-4 text-right font-mono text-zinc-400 tabular-nums">
                                {hasStatus ? (
                                    statusText
                                ) : r.position === 1 ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-bold">
                                        <Trophy className="w-3.5 h-3.5 fill-amber-400/10" />{" "}
                                        Winner
                                    </span>
                                ) : r.gapToLeader != null ? (
                                    `+${r.gapToLeader.toFixed(3)}`
                                ) : (
                                    "-"
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
