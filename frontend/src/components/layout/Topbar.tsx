"use client";

import { usePathname } from "next/navigation";

export default function Topbar() {
    const pathname = usePathname();

    const getPageContext = () => {
        switch (pathname) {
            case "/drivers":
                return {
                    title: "Driver Roster",
                    subtitle:
                        "Individual driver standings, analytics profiles, and core driver number logs",
                };
            case "/constructors":
                return {
                    title: "Constructor Standings",
                    subtitle:
                        "Factory performance markers, point gaps, and current team title rankings",
                };
            case "/races":
                return {
                    title: "Race Calendar",
                    subtitle:
                        "Grand Prix schedule maps, structured sessions, and circuit info breakdowns",
                };
            default:
                return {
                    title: "F1 Race Hub",
                    subtitle:
                        "Live season performance metrics, active statistics, and telemetry analytics",
                };
        }
    };

    const context = getPageContext();

    return (
        <header className="flex items-center justify-between border-b border-zinc-900 bg-zinc-950/60 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
            <div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black tracking-widest uppercase px-1.5 py-0.5 bg-red-600 text-white rounded-sm font-mono shadow-sm shadow-red-900/20">
                        LIVE
                    </span>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                        {context.title}
                    </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-normal hidden sm:block tracking-wide">
                    {context.subtitle}
                </p>
            </div>

            {/* Data Feed Connection Badge */}
            <div className="flex items-center gap-2 text-[11px] font-mono bg-zinc-900/80 border border-zinc-800/80 rounded-full pl-2.5 pr-3 py-1.5 shadow-inner">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </div>
                <span className="text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
                    Telemetry Linked
                </span>
            </div>
        </header>
    );
}
