"use client";

import { useEffect, useState } from "react";
import { standings as initial } from "@/mock/standings";

export function useLiveData() {
  const [data, setData] = useState(initial);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        // clone
        const updated = [...prev];

        // randomly adjust points slightly (simulate race changes)
        updated.forEach((d) => {
          const delta = Math.floor(Math.random() * 3);

          d.points += Math.random() > 0.5 ? delta : -delta;
        });

        // re-sort leaderboard
        updated.sort((a, b) => b.points - a.points);

        // update positions
        updated.forEach((d, i) => {
          d.position = i + 1;
        });

        return updated;
      });
    }, 4000); // every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return data;
}
