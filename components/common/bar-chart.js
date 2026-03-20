"use client";

import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

export function BarChart({ data, options }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      if (!canvasRef.current) {
        return;
      }

      const { default: Chart } = await import("chart.js/auto");
      if (cancelled) {
        return;
      }

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          ...options,
        },
      });
    }

    renderChart();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, options]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: 280 }}>
      <canvas ref={canvasRef} />
    </Box>
  );
}
