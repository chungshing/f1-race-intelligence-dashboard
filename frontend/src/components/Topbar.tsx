"use client";

import { usePathname } from "next/navigation";

export default function Topbar() {
    const pathname = usePathname();

    // Dynamically update subtitles based on the current active view route
    const getPageContext = () => {
        switch (pathname) {
            case "/drivers":
                return {
                    title: "Driver Roster",
                    subtitle:
                        "Individual pilot standings, telemetry, and numbers",
                };
            case "/constructors":
                return {
                    title: "Constructor Standings",
                    subtitle: "Factory performance points and team title race",
                };
            default:
                return {
                    title: "F1 Race Hub",
                    subtitle: "Live season telemetry and weekend analytics",
                };
        }
    };

    const context = getPageContext();

    return (
        <header className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
            <div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black tracking-widest uppercase px-1.5 py-0.5 bg-red-600 text-white rounded font-mono">
                        F1
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                        {context.title}
                    </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium hidden sm:block">
                    {context.subtitle}
                </p>
            </div>

            {/* Quick-Glance Global Status Badge */}
            <div className="flex items-center gap-2 text-[11px] font-mono bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-zinc-400 uppercase tracking-wider font-bold">
                    Data Feed Connected
                </span>
            </div>
        </header>
    );
}
