import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import Topbar from '@/components/layout/Topbar';
import { CONTENT_WIDTH } from '@/lib/layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className='min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-red-500/30 selection:text-white pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0'>
            <Topbar />

            <div className={`p-4 sm:p-6 md:p-10 ${CONTENT_WIDTH} w-full mx-auto`}>{children}</div>

            <Footer />
            <MobileNav />
        </main>
    );
}
