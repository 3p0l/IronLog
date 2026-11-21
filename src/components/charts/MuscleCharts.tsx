import React, { useId } from 'react';
import { MuscleDistributionItem } from '../../utils/calculations';

interface MuscleChartsProps {
  data: MuscleDistributionItem[];
  viewMode: 'bar' | 'radar';
}

export function MuscleCharts({ data, viewMode }: MuscleChartsProps) {
  const stippleId = useId();

  if (data.length === 0) {
    return (
      <div className="hud-dot-matrix flex h-52 flex-col items-center justify-center border border-dashed border-[#D4D4D4] dark:border-[#262626] px-6 text-center">
        <span className="border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
          00 // NO WORKING SETS
        </span>
        <p className="mt-2 font-mono text-xs text-[#737373]">
          Complete working sets in this timeframe to visualize muscle load.
        </p>
      </div>
    );
  }

  if (viewMode === 'bar') {
    const maxSets = Math.max(...data.map((d) => d.workingSets), 1);
    return (
      <div className="space-y-3.5">
        {data.map((item, idx) => {
          const widthPct = Math.max(4, (item.workingSets / maxSets) * 100);
          return (
            <div key={item.muscle} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF]">
                  <span className="font-mono text-[10px] text-[#737373] tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="uppercase tracking-[0.04em]">{item.muscle}</span>
                </span>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-[#000000] dark:text-[#FFFFFF]">
                  {item.workingSets} <span className="text-[#737373]">{item.workingSets === 1 ? 'SET' : 'SETS'} // {item.percentage}%</span>
                </span>
              </div>
              <div className="h-2.5 w-full border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000]">
                <div
                  className="h-full bg-[#000000] dark:bg-[#FFFFFF] transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className="hud-ruler h-1.5 w-full text-[#D4D4D4] dark:text-[#262626]" aria-hidden="true" />
            </div>
          );
        })}
      </div>
    );
  }

  // Monochrome Radar Visualization (up to top 8 muscle groups)
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
    <div className="flex flex-col items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[270px] w-full max-w-[300px] overflow-visible"
        role="img"
        aria-label="Monochrome muscle group distribution radar chart"
      >
        <defs>
          <pattern id={stippleId} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" className="fill-[#000000]/22 dark:fill-[#FFFFFF]/24" />
          </pattern>
        </defs>

        {/* Concentric dashed grid rings */}
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
            className={rIdx === rings.length - 1 ? 'stroke-[#000000] dark:stroke-[#FFFFFF]' : 'stroke-[#E5E5E5] dark:stroke-[#262626]'}
            strokeWidth={1}
            strokeDasharray={rIdx === rings.length - 1 ? undefined : '2 3'}
          />
        ))}

        {/* Axis spokes */}
        {radarItems.map((_, idx) => {
          const outer = getPoint(idx, 1);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              className="stroke-[#E5E5E5] dark:stroke-[#262626]"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill={`url(#${stippleId})`}
          className="stroke-[#000000] dark:stroke-[#FFFFFF]"
          strokeWidth={2}
          strokeLinejoin="miter"
        />

        {/* Square vertex markers + mono labels */}
        {radarItems.map((item, idx) => {
          const pt = getPoint(idx, item.workingSets / maxSets);
          const lbl = getPoint(idx, 1.24);
          return (
            <g key={`${item.muscle}-${idx}`}>
              <rect
                x={pt.x - 3}
                y={pt.y - 3}
                width={6}
                height={6}
                className="fill-[#000000] dark:fill-[#FFFFFF]"
              />
              <text
                x={lbl.x}
                y={lbl.y + 3}
                textAnchor="middle"
                className="fill-[#000000] dark:fill-[#FFFFFF] font-mono text-[9px] font-semibold uppercase"
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
