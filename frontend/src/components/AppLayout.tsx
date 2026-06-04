import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-black text-white flex">
            <Sidebar />

            <div className="flex-1">
                <Topbar />

                <div className="p-8">{children}</div>
            </div>
        </main>
    );
}
