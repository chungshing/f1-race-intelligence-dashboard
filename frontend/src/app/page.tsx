import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import DriverTable from "@/components/DriverTable";
import PointsChart from '@/components/PointsChart';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <div className="p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Championship Leader" value="Verstappen" />

            <StatCard title="Total Races" value="24" />

            <StatCard title="Constructors" value="10" />
          </section>

          <DriverTable />

          <PointsChart />
        </div>
      </div>
    </main>
  );
}
