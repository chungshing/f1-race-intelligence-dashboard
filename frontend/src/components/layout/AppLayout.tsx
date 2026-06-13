import Topbar from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans antialiased selection:bg-red-500/30 selection:text-white">
            <Topbar />
            <div className="flex-1 min-w-0 bg-linear-to-b from-zinc-950 via-black to-zinc-950">
                <div className="p-6 md:p-10 max-w-7xl w-full mx-auto">
                    {children}
                </div>
            </div>
        </main>
    );
}