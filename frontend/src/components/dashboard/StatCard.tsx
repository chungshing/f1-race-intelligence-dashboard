type StatCardProps = {
  title: string;
  value: string;
};

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <p className="text-zinc-400 text-sm mb-2">{title}</p>

      <h3 className="text-3xl font-bold text-white">{value}</h3>
    </div>
  );
}
