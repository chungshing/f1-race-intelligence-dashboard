"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const linkClass = (path: string) =>
        `block px-4 py-2 rounded-lg transition-all duration-200 ${
            pathname === path
                ? "bg-red-500/10 text-red-500 font-bold border border-red-500/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
        }`;

    return (
        <aside className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 p-6 sticky top-0 h-screen">
            <h1 className="text-2xl font-bold text-red-500 mb-10">
                F1 Dashboard
            </h1>
            <nav className="space-y-2 flex-1">
                <Link href="/" className={linkClass("/")}>
                    Dashboard
                </Link>
                <Link href="/drivers" className={linkClass("/drivers")}>
                    Drivers
                </Link>
                <Link
                    href="/constructors"
                    className={linkClass("/constructors")}
                >
                    Constructors
                </Link>
                <Link href="/races" className={linkClass("/races")}>
                    Races
                </Link>
            </nav>
            <div className="text-[10px] text-zinc-600 font-mono">
                v1.0.0-PRO
            </div>
        </aside>
    );
}
