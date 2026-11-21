import React, { useId, useMemo, useState } from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  sublabel?: string;
}

export type ChartTone = 'steel' | 'sage' | 'sand';

interface ProgressChartProps {
  data: ChartDataPoint[];
  unit?: string;
  mode?: 'line' | 'bar';
  tone?: ChartTone;
  height?: number;
  emptyMessage?: string;
  formatValue?: (val: number) => string;
}

const TONE_MAP: Record<
  ChartTone,
  {
    strokeVar: string;
    fillVar: string;
    mutedBarClass: string;
    activeBarClass: string;
  }
> = {
  steel: {
    strokeVar: 'var(--accent-steel)',
    fillVar: 'var(--accent-steel)',
    mutedBarClass: 'fill-[#4E6E8E]/25 dark:fill-[#7F98B2]/25 hover:fill-[#4E6E8E]/45 dark:hover:fill-[#7F98B2]/45',
    activeBarClass: 'fill-[#4E6E8E] dark:fill-[#7F98B2]',
  },
  sage: {
    strokeVar: 'var(--accent-sage)',
    fillVar: 'var(--accent-sage)',
    mutedBarClass: 'fill-[#4A7A62]/25 dark:fill-[#7FA692]/25 hover:fill-[#4A7A62]/45 dark:hover:fill-[#7FA692]/45',
    activeBarClass: 'fill-[#4A7A62] dark:fill-[#7FA692]',
  },
  sand: {
    strokeVar: 'var(--accent-sand)',
    fillVar: 'var(--accent-sand)',
    mutedBarClass: 'fill-[#8F7347]/25 dark:fill-[#C4AA7E]/25 hover:fill-[#8F7347]/45 dark:hover:fill-[#C4AA7E]/45',
    activeBarClass: 'fill-[#8F7347] dark:fill-[#C4AA7E]',
  },
};

function buildSmoothLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function ProgressChart({
  data,
  unit = '',
  mode = 'line',
  tone = 'steel',
  height = 220,
  emptyMessage = 'Log workouts in this timeframe to see progress',
  formatValue,
}: ProgressChartProps) {
  const areaGradId = useId();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const meanValue = useMemo(() => {
    if (values.length === 0) return 0;
    return values.reduce((acc, v) => acc + v, 0) / values.length;
  }, [values]);

  const palette = TONE_MAP[tone];

  if (data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-hairline)] bg-[var(--recessed)] px-6 text-center"
        style={{ height }}
      >
        <p className="text-sm font-medium text-[var(--ink-primary)]">No data in range</p>
        <p className="mt-1 max-w-xs text-xs text-[var(--ink-secondary)]">{emptyMessage}</p>
      </div>
    );
  }

  const width = 640;
  const padLeft = 48;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 32;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const minVal =
    mode === 'bar' ? 0 : Math.max(0, rawMin - (rawMax - rawMin) * 0.2 || rawMin * 0.85);
  const maxVal =
    rawMax === minVal ? (rawMax === 0 ? 10 : rawMax * 1.2) : rawMax + (rawMax - minVal) * 0.16;
  const range = maxVal - minVal || 1;

  const getX = (idx: number) => {
    if (data.length === 1) return padLeft + chartW / 2;
    if (mode === 'bar') {
      const slot = chartW / data.length;
      return padLeft + slot * idx + slot / 2;
    }
    return padLeft + (idx / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / range;
    return padTop + chartH - ratio * chartH;
  };

  const yTicks = [0, 0.33, 0.66, 1].map((t) => minVal + t * range);
  const plotPoints = data.map((pt, i) => ({ x: getX(i), y: getY(pt.value) }));
  const linePath = buildSmoothLinePath(plotPoints);
  const areaPath =
    data.length > 1
      ? `${linePath} L ${plotPoints[plotPoints.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${plotPoints[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
      : '';

  const activeIdx =
    selectedIndex !== null && selectedIndex < data.length ? selectedIndex : data.length - 1;
  const activePoint = data[activeIdx];
  const activeX = getX(activeIdx);
  const activeY = getY(activePoint.value);
  const baselineY = getY(meanValue);

  const displayVal = (v: number) =>
    formatValue
      ? formatValue(v)
      : `${
          Number.isInteger(v)
            ? v.toLocaleString()
            : v.toLocaleString(undefined, { maximumFractionDigits: 1 })
        }${unit ? ` ${unit}` : ''}`;

  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  const tooltipW = 156;
  const tooltipH = 44;
  const tooltipX = Math.max(padLeft, Math.min(width - padRight - tooltipW, activeX - tooltipW / 2));
  const tooltipY =
    activeY - tooltipH - 12 < 4
      ? Math.min(padTop + chartH - tooltipH, activeY + 12)
      : activeY - tooltipH - 12;

  const delta = data.length > 1 ? data[data.length - 1].value - data[0].value : 0;
  const deltaFormatted = `${delta > 0 ? '+' : ''}${
    Number.isInteger(delta) ? delta.toLocaleString() : Number(delta.toFixed(1)).toLocaleString()
  }${unit ? ` ${unit}` : ''}`;
  const firstLabel = data[0]?.label ?? '';

  return (
    <div className="w-full">
      {/* Metric Summary Row */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-[var(--border-hairline)] pb-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-xl font-semibold tabular-nums whitespace-nowrap text-[var(--ink-primary)]">
            {displayVal(activePoint.value)}
          </span>
          <span className="text-xs whitespace-nowrap text-[var(--ink-secondary)]">
            <span className="font-mono tabular-nums">{activePoint.label}</span>
            {activePoint.sublabel ? ` · ${activePoint.sublabel}` : ''}
          </span>
        </div>
        {data.length > 1 && (
          <div className="flex items-center gap-3 text-xs whitespace-nowrap">
            <span className="text-[var(--ink-muted)]">
              Avg{' '}
              <span className="font-mono tabular-nums text-[var(--ink-secondary)]">
                {displayVal(Number(meanValue.toFixed(1)))}
              </span>
            </span>
            <span
              className="rounded-[6px] border px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums"
              style={{
                backgroundColor:
                  mode === 'bar'
                    ? 'var(--accent-steel-tint)'
                    : delta >= 0
                    ? 'var(--accent-sage-tint)'
                    : 'var(--accent-clay-tint)',
                borderColor:
                  mode === 'bar'
                    ? 'var(--accent-steel-border)'
                    : delta >= 0
                    ? 'var(--accent-sage-border)'
                    : 'var(--accent-clay-border)',
                color:
                  mode === 'bar'
                    ? 'var(--accent-steel)'
                    : delta >= 0
                    ? 'var(--accent-sage)'
                    : 'var(--accent-clay)',
              }}
            >
              {mode === 'bar'
                ? `Peak ${displayVal(rawMax)} in range`
                : `${deltaFormatted} vs ${firstLabel}`}
            </span>
          </div>
        )}
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible select-none"
          role="img"
          aria-label="Progress chart"
          onMouseLeave={() => setIsHovering(false)}
        >
          <defs>
            <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.fillVar} stopOpacity="0.08" />
              <stop offset="100%" stopColor={palette.fillVar} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Ultra-faint horizontal gridlines */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            const tickStr =
              tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : String(Math.round(tick));
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke={idx === 0 ? 'var(--border-hairline)' : 'var(--chart-grid)'}
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="var(--ink-muted)"
                  className="font-mono text-[10px] tabular-nums"
                >
                  {tickStr}
                </text>
              </g>
            );
          })}

          {/* Mean baseline */}
          {data.length > 1 && (
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={baselineY}
              y2={baselineY}
              stroke="var(--chart-baseline)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}

          {/* Vertical scrubber crosshair */}
          <line
            x1={activeX}
            x2={activeX}
            y1={padTop}
            y2={padTop + chartH}
            stroke={palette.strokeVar}
            strokeWidth={1}
            strokeDasharray="3 3"
            strokeOpacity={isHovering ? 0.5 : 0.18}
          />

          {mode === 'line' ? (
            <>
              {areaPath && <path d={areaPath} fill={`url(#${areaGradId})`} />}
              {data.length > 1 && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={palette.strokeVar}
                  strokeWidth={1.75}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {data.map((pt, idx) => {
                const x = getX(idx);
                const y = getY(pt.value);
                const isSelected = idx === activeIdx;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setSelectedIndex(idx);
                      setIsHovering(true);
                    }}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setIsHovering(true);
                    }}
                  >
                    <rect x={x - 14} y={padTop} width={28} height={chartH} fill="transparent" />
                    {isSelected && (
                      <circle cx={x} cy={y} r={6} fill={palette.fillVar} fillOpacity={0.16} />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 3.5 : 2.5}
                      fill={isSelected ? palette.strokeVar : 'var(--surface)'}
                      stroke={palette.strokeVar}
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}
            </>
          ) : (
            data.map((pt, idx) => {
              const slot = chartW / data.length;
              const barW = Math.min(28, Math.max(10, slot * 0.52));
              const x = getX(idx) - barW / 2;
              const y = getY(pt.value);
              const barH = Math.max(3, padTop + chartH - y);
              const isSelected = idx === activeIdx;
              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    setSelectedIndex(idx);
                    setIsHovering(true);
                  }}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setIsHovering(true);
                  }}
                >
                  <rect
                    x={getX(idx) - slot / 2}
                    y={padTop}
                    width={slot}
                    height={chartH}
                    fill="transparent"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={4}
                    className={`transition-colors ${
                      isSelected ? palette.activeBarClass : palette.mutedBarClass
                    }`}
                  />
                </g>
              );
            })
          )}

          {/* X-axis labels */}
          {data.map((pt, idx) => {
            if (idx % labelStep !== 0 && idx !== data.length - 1) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="var(--ink-muted)"
                className="font-mono text-[10px] tabular-nums"
              >
                {pt.label}
              </text>
            );
          })}

          {/* Matte floating tooltip */}
          {isHovering && (
            <g className="pointer-events-none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipW}
                height={tooltipH}
                rx={8}
                fill="var(--surface)"
                stroke="var(--border-focus)"
                strokeWidth={1}
              />
              <text
                x={tooltipX + 12}
                y={tooltipY + 16}
                fill="var(--ink-secondary)"
                className="font-mono text-[10px]"
              >
                {activePoint.label}
              </text>
              <text
                x={tooltipX + 12}
                y={tooltipY + 34}
                fill="var(--ink-primary)"
                className="font-mono text-[12px] font-semibold tabular-nums"
              >
                {displayVal(activePoint.value)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
