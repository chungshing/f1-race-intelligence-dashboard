"use client";

import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { pointsHistory } from "@/mock/pointsHistory";

export default function PointsChart() {
  const [data, setData] = useState(pointsHistory);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((race) => ({
          ...race,
          verstappen: race.verstappen + Math.floor(Math.random() * 3),
          leclerc: race.leclerc + Math.floor(Math.random() * 3),
        })),
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-87.5">
      <h3 className="text-white text-xl font-semibold mb-4">
        Championship Battle
      </h3>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#27272a" />
            <XAxis dataKey="race" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="verstappen"
              stroke="#facc15"
              strokeWidth={2}
            />

            <Line
              type="monotone"
              dataKey="leclerc"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
