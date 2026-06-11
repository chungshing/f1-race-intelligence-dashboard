import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-black text-white flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar />
                <div className="p-4 md:p-8">{children}</div>
            </div>
        </main>
    );
}
