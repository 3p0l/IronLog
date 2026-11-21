import React from 'react';
import { MuscleDistributionItem } from '../../utils/calculations';

interface MuscleChartsProps {
  data: MuscleDistributionItem[];
  viewMode: 'bar' | 'radar';
}

export function MuscleCharts({ data, viewMode }: MuscleChartsProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--recessed)] px-6 text-center">
        <p className="text-sm font-medium text-[var(--ink-primary)]">No working sets in range</p>
        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
          Complete working sets to view muscle distribution
        </p>
      </div>
    );
  }

  if (viewMode === 'bar') {
    const maxSets = Math.max(...data.map((d) => d.workingSets), 1);
    return (
      <div className="space-y-3">
        {data.map((item) => {
          const widthPct = Math.max(4, (item.workingSets / maxSets) * 100);
          return (
            <div key={item.muscle} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-[var(--ink-primary)]">
                  {item.muscle}
                </span>
                <span className="font-mono text-xs tabular-nums text-[var(--ink-secondary)]">
                  <span className="font-medium text-[var(--ink-primary)]">
                    {item.workingSets}
                  </span>{' '}
                  {item.workingSets === 1 ? 'set' : 'sets'} · {item.percentage}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--recessed)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-steel)] transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Smooth Radar Visualization (up to top 8 muscle groups)
  const radarItems = data.slice(0, 8);
  while (radarItems.length < 3) {
    radarItems.push({ muscle: 'Full Body', workingSets: 0, percentage: 0 });
  }
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 92;
  const maxSets = Math.max(...radarItems.map((d) => d.workingSets), 1);
  const count = radarItems.length;

  const getPoint = (idx: number, ratio: number) => {
    const angle = (Math.PI * 2 * idx) / count - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius * ratio,
      y: cy + Math.sin(angle) * radius * ratio,
    };
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const polygonPoints = radarItems
    .map((item, idx) => {
      const pt = getPoint(idx, item.workingSets / maxSets);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[268px] w-full max-w-[300px] overflow-visible"
        role="img"
        aria-label="Muscle group distribution radar chart"
      >
        {rings.map((r, rIdx) => (
          <polygon
            key={r}
            points={radarItems
              .map((_, idx) => {
                const p = getPoint(idx, r);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(' ')}
            fill="none"
            stroke={rIdx === rings.length - 1 ? 'var(--border-focus)' : 'var(--chart-grid)'}
            strokeWidth={1}
          />
        ))}

        {radarItems.map((_, idx) => {
          const outer = getPoint(idx, 1);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill="var(--accent-steel-tint)"
          stroke="var(--accent-steel)"
          strokeWidth={1.75}
          strokeLinejoin="round"
        />

        {radarItems.map((item, idx) => {
          const pt = getPoint(idx, item.workingSets / maxSets);
          const lbl = getPoint(idx, 1.24);
          return (
            <g key={`${item.muscle}-${idx}`}>
              <circle cx={pt.x} cy={pt.y} r={3} fill="var(--accent-steel)" />
              <text
                x={lbl.x}
                y={lbl.y + 3}
                textAnchor="middle"
                fill="var(--ink-secondary)"
                className="text-[10px] font-medium"
              >
                {item.muscle}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
