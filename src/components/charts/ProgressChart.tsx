import React, { useId, useMemo, useState } from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  sublabel?: string;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
  unit?: string;
  mode?: 'line' | 'bar';
  height?: number;
  emptyMessage?: string;
  formatValue?: (val: number) => string;
}

export function ProgressChart({
  data,
  unit = '',
  mode = 'line',
  height = 220,
  emptyMessage = 'Log workouts in this timeframe to populate telemetry.',
  formatValue,
}: ProgressChartProps) {
  const stippleId = useId();
  const hatchId = useId();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const values = useMemo(() => data.map((d) => d.value), [data]);
  const peakIndex = useMemo(() => {
    if (values.length === 0) return -1;
    let maxIdx = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] >= values[maxIdx]) maxIdx = i;
    }
    return maxIdx;
  }, [values]);

  const meanValue = useMemo(() => {
    if (values.length === 0) return 0;
    return values.reduce((acc, v) => acc + v, 0) / values.length;
  }, [values]);

  if (data.length === 0) {
    return (
      <div
        className="hud-dot-matrix flex flex-col items-center justify-center border border-dashed border-[#D4D4D4] dark:border-[#262626] px-6 text-center"
        style={{ height }}
      >
        <span className="border border-[#000000] dark:border-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase text-[#000000] dark:text-[#FFFFFF]">
          00 // NO TELEMETRY
        </span>
        <p className="mt-2.5 max-w-xs font-mono text-xs text-[#737373]">{emptyMessage}</p>
      </div>
    );
  }

  const width = 640;
  const padLeft = 50;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 32;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const minVal = mode === 'bar' ? 0 : Math.max(0, rawMin - (rawMax - rawMin) * 0.18 || rawMin * 0.85);
  const maxVal = rawMax === minVal ? (rawMax === 0 ? 10 : rawMax * 1.2) : rawMax + (rawMax - minVal) * 0.14;
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

  const linePath = data
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(pt.value).toFixed(1)}`)
    .join(' ');

  const areaPath =
    data.length > 1
      ? `${linePath} L ${getX(data.length - 1).toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
      : '';

  const activeIdx = selectedIndex !== null && selectedIndex < data.length ? selectedIndex : data.length - 1;
  const activePoint = data[activeIdx];
  const activeX = getX(activeIdx);
  const activeY = getY(activePoint.value);
  const baselineY = getY(meanValue);

  const displayVal = (v: number) =>
    formatValue
      ? formatValue(v)
      : `${Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1)}${unit ? ` ${unit}` : ''}`;

  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  // Tooltip clamping inside SVG viewBox
  const tooltipW = 152;
  const tooltipH = 42;
  const tooltipX = Math.max(padLeft, Math.min(width - padRight - tooltipW, activeX - tooltipW / 2));
  const tooltipY = activeY - tooltipH - 12 < 4 ? Math.min(padTop + chartH - tooltipH, activeY + 12) : activeY - tooltipH - 12;

  const delta = data.length > 1 ? data[data.length - 1].value - data[0].value : 0;
  const deltaGlyph = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';
  const deltaFormatted = `${delta > 0 ? '+' : ''}${
    Number.isInteger(delta) ? delta.toLocaleString() : Number(delta.toFixed(1)).toLocaleString()
  }${unit ? ` ${unit}` : ''}`;

  return (
    <div className="w-full">
      {/* Telemetry Header Readout */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[#E5E5E5] dark:border-[#262626] pb-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="font-mono text-xl font-bold tabular-nums whitespace-nowrap text-[#000000] dark:text-[#FFFFFF]">
            {displayVal(activePoint.value)}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] whitespace-nowrap text-[#737373]">
            {activePoint.label}
            {activePoint.sublabel ? ` // ${activePoint.sublabel}` : ''}
          </span>
        </div>
        {data.length > 1 && (
          <div className="flex items-center gap-2.5 font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap">
            <span className="text-[#737373] uppercase">
              AVG {displayVal(Number(meanValue.toFixed(1)))}
            </span>
            <span className="border border-[#000000] dark:border-[#FFFFFF] bg-[#000000] dark:bg-[#FFFFFF] px-1.5 py-0.5 text-[10px] text-[#FFFFFF] dark:text-[#000000]">
              {mode === 'bar'
                ? `PEAK ${displayVal(rawMax)}`
                : `${deltaGlyph} ${deltaFormatted}`}
            </span>
          </div>
        )}
      </div>

      {/* Monochrome Technical SVG Plot */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible select-none"
          role="img"
          aria-label="Monochrome telemetry chart"
          onMouseLeave={() => setIsHovering(false)}
        >
          <defs>
            {/* 6px Monochrome Dot-Matrix Stipple */}
            <pattern id={stippleId} width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="0.85" className="fill-[#000000]/16 dark:fill-[#FFFFFF]/18" />
            </pattern>
            {/* 45deg Monochrome Diagonal Hatch for Secondary Bars */}
            <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="stroke-[#000000] dark:stroke-[#FFFFFF]" strokeWidth="1.25" strokeOpacity="0.32" />
            </pattern>
          </defs>

          {/* Horizontal dashed gridlines + registration ticks + Y labels */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            const tickStr = tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : String(Math.round(tick));
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  className={idx === 0 ? 'stroke-[#000000] dark:stroke-[#FFFFFF]' : 'stroke-[#E5E5E5] dark:stroke-[#262626]'}
                  strokeWidth={1}
                  strokeDasharray={idx === 0 ? undefined : '2 4'}
                />
                <line
                  x1={padLeft - 4}
                  x2={padLeft}
                  y1={y}
                  y2={y}
                  className="stroke-[#000000] dark:stroke-[#FFFFFF]"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[#737373] font-mono text-[10px] tabular-nums"
                >
                  {tickStr}
                </text>
              </g>
            );
          })}

          {/* Baseline Mean Comparison Hairline */}
          {data.length > 1 && (
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={baselineY}
              y2={baselineY}
              className="stroke-[#737373]"
              strokeWidth={1}
              strokeDasharray="5 4"
            />
          )}

          {/* Magnetic Crosshair Scrubber */}
          <line
            x1={activeX}
            x2={activeX}
            y1={padTop}
            y2={padTop + chartH}
            className="stroke-[#000000] dark:stroke-[#FFFFFF]"
            strokeWidth={1}
            strokeDasharray="3 3"
            strokeOpacity={isHovering ? 0.7 : 0.25}
          />
          {isHovering && (
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={activeY}
              y2={activeY}
              className="stroke-[#000000] dark:stroke-[#FFFFFF]"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.45}
            />
          )}

          {mode === 'line' ? (
            <>
              {areaPath && <path d={areaPath} fill={`url(#${stippleId})`} />}
              {data.length > 1 && (
                <path
                  d={linePath}
                  fill="none"
                  className="stroke-[#000000] dark:stroke-[#FFFFFF]"
                  strokeWidth={2}
                  strokeLinejoin="miter"
                  strokeLinecap="square"
                />
              )}
              {data.map((pt, idx) => {
                const x = getX(idx);
                const y = getY(pt.value);
                const isSelected = idx === activeIdx;
                const isPeak = idx === peakIndex && data.length > 1;
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
                    {/* Active Diamond Reticle */}
                    {isSelected && (
                      <polygon
                        points={`${x},${y - 7} ${x + 7},${y} ${x},${y + 7} ${x - 7},${y}`}
                        className="fill-[#FFFFFF] dark:fill-[#000000] stroke-[#000000] dark:stroke-[#FFFFFF]"
                        strokeWidth={1.5}
                      />
                    )}
                    {/* Peak Diamond vs Standard Sharp Square Node */}
                    {isPeak ? (
                      <polygon
                        points={`${x},${y - 4.5} ${x + 4.5},${y} ${x},${y + 4.5} ${x - 4.5},${y}`}
                        className="fill-[#000000] dark:fill-[#FFFFFF]"
                      />
                    ) : (
                      <rect
                        x={x - (isSelected ? 3 : 2.5)}
                        y={y - (isSelected ? 3 : 2.5)}
                        width={isSelected ? 6 : 5}
                        height={isSelected ? 6 : 5}
                        className={
                          isSelected
                            ? 'fill-[#000000] dark:fill-[#FFFFFF]'
                            : 'fill-[#FFFFFF] dark:fill-[#000000] stroke-[#000000] dark:stroke-[#FFFFFF]'
                        }
                        strokeWidth={1.5}
                      />
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            data.map((pt, idx) => {
              const slot = chartW / data.length;
              const barW = Math.min(32, Math.max(10, slot * 0.56));
              const x = getX(idx) - barW / 2;
              const y = getY(pt.value);
              const barH = Math.max(2, padTop + chartH - y);
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
                  <rect x={getX(idx) - slot / 2} y={padTop} width={slot} height={chartH} fill="transparent" />
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    fill={isSelected ? undefined : `url(#${hatchId})`}
                    className={
                      isSelected
                        ? 'fill-[#000000] dark:fill-[#FFFFFF] stroke-[#000000] dark:stroke-[#FFFFFF]'
                        : 'stroke-[#000000] dark:stroke-[#FFFFFF]'
                    }
                    strokeWidth={1}
                  />
                  {/* Crisp top cap tick */}
                  <line
                    x1={x}
                    x2={x + barW}
                    y1={y}
                    y2={y}
                    className="stroke-[#000000] dark:stroke-[#FFFFFF]"
                    strokeWidth={2}
                  />
                </g>
              );
            })
          )}

          {/* X axis registration ticks + labels */}
          {data.map((pt, idx) => {
            if (idx % labelStep !== 0 && idx !== data.length - 1) return null;
            const x = getX(idx);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  x2={x}
                  y1={padTop + chartH}
                  y2={padTop + chartH + 4}
                  className="stroke-[#000000] dark:stroke-[#FFFFFF]"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-[#737373] font-mono text-[10px] uppercase tabular-nums"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}

          {/* Snapped Inverted Floating Telemetry Tooltip (visible on hover/tap) */}
          {isHovering && (
            <g className="pointer-events-none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipW}
                height={tooltipH}
                rx={2}
                className="fill-[#000000] dark:fill-[#FFFFFF] stroke-[#FFFFFF] dark:stroke-[#000000]"
                strokeWidth={1}
              />
              <text
                x={tooltipX + 8}
                y={tooltipY + 15}
                className="fill-[#A3A3A3] dark:fill-[#525252] font-mono text-[9px] uppercase"
              >
                {activePoint.label}
              </text>
              <text
                x={tooltipX + 8}
                y={tooltipY + 32}
                className="fill-[#FFFFFF] dark:fill-[#000000] font-mono text-[12px] font-bold tabular-nums"
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
