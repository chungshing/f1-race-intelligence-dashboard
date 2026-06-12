"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Flag } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/drivers", label: "Drivers", icon: Users },
        { href: "/constructors", label: "Constructors", icon: ShieldAlert },
        { href: "/races", label: "Races", icon: Flag },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-900 sticky top-0 h-screen overflow-y-auto select-none">
            {/* Branding Header Banner */}
            <div className="p-6 border-b border-zinc-900 bg-linear-to-br from-zinc-900/40 via-transparent to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full" />
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-1 bg-red-600 rounded-sm" />
                    <h1 className="text-xl font-black text-white tracking-wider uppercase font-mono">
                        F1
                        <span className="text-red-500 font-sans font-light tracking-normal lowercase ml-1">
                            pitwall
                        </span>
                    </h1>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4 space-y-1.5 flex-1 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                                isActive
                                    ? "bg-red-500/10 text-red-500 font-semibold"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                            }`}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-3 bottom-3 w-1 bg-red-500 rounded-r-md" />
                            )}
                            <Icon
                                className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                                    isActive
                                        ? "text-red-500"
                                        : "text-zinc-500 group-hover:text-zinc-400"
                                }`}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Build Metric */}
            <div className="p-4 border-t border-zinc-900/60 bg-zinc-950/40 flex items-center justify-between">
                <div className="text-[10px] text-zinc-600 font-mono tracking-wider uppercase">
                    Core Engine
                </div>
                <div className="px-2 py-0.5 text-[10px] text-red-500/80 bg-red-500/5 rounded border border-red-500/10 font-mono font-bold">
                    v1.0.0-PRO
                </div>
            </div>
        </aside>
    );
}
