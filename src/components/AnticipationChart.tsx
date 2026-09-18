import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { TimelinePoint } from "../api/types";

export function AnticipationChart({ timeline }: { timeline: TimelinePoint[] }) {
  return (
    <div className="anticipation-chart" aria-label="Anticipatory risk chart">
      <ResponsiveContainer width="100%" height={126}>
        <LineChart data={timeline} margin={{ left: 6, right: 6, top: 8, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis hide domain={[0, 1]} />
          <Tooltip
            formatter={(value: number) => `${Math.round(value * 100)}%`}
            labelFormatter={(label) => String(label)}
          />
          <Line
            type="monotone"
            dataKey="risk_score"
            stroke="#f08a37"
            strokeWidth={3}
            dot={{ r: 4, fill: "#f4f7fb", strokeWidth: 1, stroke: "#f08a37" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
