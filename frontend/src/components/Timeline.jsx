import React, { useMemo, useState, useRef, useEffect } from 'react';
import { colorFor } from '../App.jsx';

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

export default function Timeline({ events, meta }) {
  const [tooltip, setTooltip] = useState(null);
  const [ref, w] = useContainerWidth();
  
  const { subsystems, yIndex, height } = useMemo(() => {
    const subs = [...new Set(events.map(e => e.subsystem || '(none)'))].sort();
    const rowH = 16, pad = { l: 190, r: 20, t: 10, b: 24 };
    const h = pad.t + pad.b + subs.length * rowH;
    const yIdx = new Map(subs.map((s, i) => [s, pad.t + i * rowH + rowH / 2]));
    return { subsystems: subs, yIndex: yIdx, height: h, pad, rowH };
  }, [events]);

  const pad = { l: 190, r: 20, t: 10, b: 24 };
  const t0 = meta.start, t1 = meta.end;
  const span = Math.max(t1 - t0, 0.001);
  const xw = w - pad.l - pad.r;

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height}>
        {subsystems.map((sub) => {
          const y = yIndex.get(sub);
          return (
            <g key={sub}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#1c2029" />
              <text x={4} y={y + 3}>{sub}</text>
            </g>
          );
        })}
        
        {events.map((e, i) => {
          const x = pad.l + ((e.t - t0) / span) * xw;
          const y = yIndex.get(e.subsystem || '(none)');
          return (
            <circle
              key={i}
              cx={x.toFixed(1)}
              cy={y.toFixed(1)}
              r={3}
              fill={colorFor(e.action)}
              onMouseMove={(ev) => {
                setTooltip({
                  x: ev.clientX + 14,
                  y: ev.clientY + 14,
                  content: `t=${e.t.toFixed(6)}s  ${e.src}\naction:    ${e.action}\nsubsystem: ${e.subsystem}\ndevpath:   ${e.devpath}\n` +
                           (e.iface ? `iface:     ${e.iface}\n` : '') +
                           (e.driver ? `driver:    ${e.driver}\n` : '') +
                           (e.seq ? `seq:       ${e.seq}` : '')
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </svg>
      {tooltip && (
        <div 
          className="tooltip" 
          style={{ display: 'block', left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
