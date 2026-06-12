import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-black text-zinc-100 flex font-sans antialiased selection:bg-red-500/30 selection:text-white">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-linear-to-b from-zinc-950 to-black">
                <Topbar />
                <div className="p-5 md:p-8 max-w-400 w-full mx-auto">
                    {children}
                </div>
            </div>
        </main>
    );
}
