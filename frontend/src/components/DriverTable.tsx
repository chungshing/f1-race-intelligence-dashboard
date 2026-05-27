"use client";

import { useLiveData } from '@/hook/useLiveData';

function getPositionColor(pos: number) {
  if (pos === 1) return "text-yellow-400";
  if (pos === 2) return "text-zinc-300";
  if (pos === 3) return "text-orange-400";
  return "text-zinc-400";
}

function getChangeIcon(change: number) {
  if (change > 0) return `▲ +${change}`;
  if (change < 0) return `▼ ${change}`;
  return "-";
}

function getChangeColor(change: number) {
  if (change > 0) return "text-green-400";
  if (change < 0) return "text-red-400";
  return "text-zinc-500";
}

export default function DriverTable() {
  const standings = useLiveData();
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Driver Standings</h3>

        <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-black font-bold">
          LIVE
        </span>
      </div>

      {/* Table */}
      <table className="w-full text-left">
        <thead className="bg-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="p-4">Pos</th>
            <th className="p-4">Driver</th>
            <th className="p-4">Change</th>
            <th className="p-4">Team</th>
            <th className="p-4 text-right">Points</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((driver) => (
            <tr
              key={driver.position}
              className="border-t border-zinc-800 hover:bg-zinc-800/60 transition"
            >
              {/* Position */}
              <td
                className={`p-4 font-bold ${getPositionColor(driver.position)}`}
              >
                P{driver.position}
              </td>

              {/* Driver */}
              <td className="p-4 text-white font-medium">{driver.driver}</td>

              {/* Change */}
              <td
                className={`p-4 font-medium ${getChangeColor(driver.change)}`}
              >
                {getChangeIcon(driver.change)}
              </td>

              {/* Team */}
              <td className="p-4 text-zinc-400">{driver.team}</td>

              {/* Points */}
              <td className="p-4 text-right font-semibold text-red-400">
                {driver.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
