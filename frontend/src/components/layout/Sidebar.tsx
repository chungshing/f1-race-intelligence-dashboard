"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const linkClass = (path: string) =>
        `block transition ${
            pathname === path
                ? "text-red-500 font-semibold"
                : "text-zinc-300 hover:text-white"
        }`;

    return (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6">
            <h1 className="text-2xl font-bold text-red-500 mb-10">
                F1 Dashboard
            </h1>

            <nav className="space-y-4">
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
        </aside>
    );
}
