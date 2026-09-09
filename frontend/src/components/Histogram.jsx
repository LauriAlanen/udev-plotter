import React, { useMemo, useState, useRef, useEffect } from 'react';

function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(900);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export default function Histogram({ events, meta }) {
  const [ref, w] = useContainerWidth();
  const h = 120, pad = { l: 30, r: 10, t: 6, b: 18 };
  
  const rects = useMemo(() => {
    if (!events.length) return { max: 1, counts: [], bw: 1, t0: 0, span: 1, bucketCount: 80 };
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
  }, [events, meta.start, meta.end, w]);

  if (!events.length) {
    return (
      <div ref={ref} style={{ width: '100%' }}>
        <svg width="100%" height={h}></svg>
      </div>
    );
  }

  const { counts, max, bw, t0, span, bucketCount } = rects;

  return (
    <div ref={ref} style={{ width: '100%' }}>
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
    </div>
  );
}
