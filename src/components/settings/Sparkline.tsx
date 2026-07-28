import { formatUsd } from "@/lib/format";

interface Point {
  date: string;
  costUsd: number;
}

// ponytail: a minimal single-series SVG line, not a charting library --
// one series needs no legend (the card title names it), and native <title>
// elements give a basic hover tooltip with zero extra JS. Upgrade to a real
// chart component if this panel ever needs multiple series or brushing.
export function Sparkline({ data }: { data: Point[] }) {
  const width = 280;
  const height = 56;
  const max = Math.max(0.0001, ...data.map((d) => d.costUsd));

  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * width : width / 2;
    const y = height - (d.costUsd / max) * (height - 8) - 4;
    return { x, y, ...d };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full text-primary"
      role="img"
      aria-label="Daily AI spend over the last 30 days"
    >
      <line
        x1={0}
        y1={height - 4}
        x2={width}
        y2={height - 4}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={1}
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p) => (
        <circle key={p.date} cx={p.x} cy={p.y} r={p.costUsd > 0 ? 2.5 : 0} fill="currentColor">
          <title>{`${p.date}: ${formatUsd(p.costUsd)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
