import React, { useMemo } from 'react';

export default function Histogram({ events, meta }) {
  const w = 900, h = 120, pad = { l: 30, r: 10, t: 6, b: 18 };
  
  const rects = useMemo(() => {
    if (!events.length) return { max: 1, buckets: [], bw: 1 };
    const t0 = meta.start, t1 = meta.end;
    const bucketCount = 80;
    const span = Math.max(t1 - t0, 0.001);
    const counts = new Array(bucketCount).fill(0);
    
    for (const e of events) {
      let idx = Math.floor((e.t - t0) / span * bucketCount);
      if (idx >= bucketCount) idx = bucketCount - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    }
    const max = Math.max(...counts, 1);
    const bw = (w - pad.l - pad.r) / bucketCount;
    return { counts, max, bw, t0, span, bucketCount };
  }, [events, meta.start, meta.end]);

  if (!events.length) return <svg width="100%" height={h}></svg>;

  const { counts, max, bw, t0, span, bucketCount } = rects;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      {counts.map((count, i) => {
        const bh = (count / max) * (h - pad.t - pad.b);
        const x = pad.l + i * bw;
        const y = h - pad.b - bh;
        return (
          <rect 
            key={i} 
            x={x.toFixed(1)} 
            y={y.toFixed(1)} 
            width={(bw - 1).toFixed(1)} 
            height={bh.toFixed(1)} 
            fill="#3b82f6" 
            opacity="0.75"
          >
            <title>{(t0 + i * span / bucketCount).toFixed(2)}s: {count} events</title>
          </rect>
        );
      })}
      <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#2a2f3a" />
      <text x={pad.l} y={h - 4}>{t0.toFixed(1)}s</text>
      <text x={w - pad.r - 30} y={h - 4}>{(meta.end || 0).toFixed(1)}s</text>
    </svg>
  );
}
