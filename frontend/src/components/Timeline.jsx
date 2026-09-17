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
  const svgRef = useRef(null);
  
  const [viewDomain, setViewDomain] = useState([meta.start, meta.end]);
  const [showCtrlPrompt, setShowCtrlPrompt] = useState(false);
  const promptTimeout = useRef(null);
  
  // Reset zoom if meta bounds change significantly
  useEffect(() => {
    setViewDomain([meta.start, meta.end]);
  }, [meta.start, meta.end]);

  const { subsystems, yIndex, height, pad } = useMemo(() => {
    const subs = [...new Set(events.map(e => e.subsystem || '(none)'))].sort();
    const rowH = 16, padding = { l: 190, r: 20, t: 10, b: 24 };
    const h = padding.t + padding.b + subs.length * rowH;
    const yIdx = new Map(subs.map((s, i) => [s, padding.t + i * rowH + rowH / 2]));
    return { subsystems: subs, yIndex: yIdx, height: h, pad: padding, rowH };
  }, [events]);

  const xw = w - pad.l - pad.r;
  const [t0, t1] = viewDomain;
  const span = Math.max(t1 - t0, 0.001);
  
  // Wheel event for Zooming
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    
    const handleWheel = (e) => {
      // Require Ctrl/Cmd to zoom, otherwise allow normal page scroll
      if (!e.ctrlKey && !e.metaKey) {
        setShowCtrlPrompt(true);
        if (promptTimeout.current) clearTimeout(promptTimeout.current);
        promptTimeout.current = setTimeout(() => setShowCtrlPrompt(false), 1500);
        return;
      }
      
      setShowCtrlPrompt(false);
      e.preventDefault();
      
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - pad.l;
      
      if (mouseX < 0 || mouseX > xw) return; // ignore zoom outside plot area

      const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8; // 20% zoom per tick
      const currentSpan = viewDomain[1] - viewDomain[0];
      const timeAtMouse = viewDomain[0] + (mouseX / xw) * currentSpan;
      
      let newSpan = currentSpan * zoomFactor;
      const minSpan = 0.0001; 
      const maxSpan = (meta.end - meta.start) || 0.001;
      
      if (newSpan < minSpan) newSpan = minSpan;
      if (newSpan > maxSpan) newSpan = maxSpan;

      let newStart = timeAtMouse - (mouseX / xw) * newSpan;
      let newEnd = newStart + newSpan;

      // Clamp to global bounds
      if (newStart < meta.start) {
        newStart = meta.start;
        newEnd = newStart + newSpan;
      }
      if (newEnd > meta.end) {
        newEnd = meta.end;
        newStart = newEnd - newSpan;
      }
      if (newStart < meta.start) newStart = meta.start; // hard cap

      setViewDomain([newStart, newEnd]);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [viewDomain, meta.start, meta.end, xw, pad.l]);

  // Dragging event for Panning
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(null);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setLastMouseX(e.clientX);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    setLastMouseX(e.clientX);
    
    const currentSpan = viewDomain[1] - viewDomain[0];
    const timeShift = -(dx / xw) * currentSpan;
    
    let newStart = viewDomain[0] + timeShift;
    let newEnd = viewDomain[1] + timeShift;
    
    if (newStart < meta.start) {
      newStart = meta.start;
      newEnd = newStart + currentSpan;
    }
    if (newEnd > meta.end) {
      newEnd = meta.end;
      newStart = newEnd - currentSpan;
    }
    setViewDomain([newStart, newEnd]);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  // Only render events that fall within our zoomed viewport
  const visibleEvents = useMemo(() => {
    return events.filter(e => e.t >= t0 && e.t <= t1);
  }, [events, t0, t1]);

  const isZoomed = viewDomain[0] > meta.start || viewDomain[1] < meta.end;

  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      {showCtrlPrompt && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.75)', color: 'white', padding: '12px 24px', 
          borderRadius: '8px', pointerEvents: 'none', zIndex: 20, 
          fontSize: '14px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          Use Ctrl + scroll to zoom the timeline
        </div>
      )}
      {isZoomed && (
        <button 
          onClick={() => setViewDomain([meta.start, meta.end])}
          style={{ position: 'absolute', top: '-30px', right: '0', background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', zIndex: 10, fontSize: '12px' }}
        >
          Reset Zoom
        </button>
      )}
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${w} ${height}`} 
        width="100%" 
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
        <clipPath id="plot-area">
          <rect x={pad.l} y={0} width={xw} height={height} />
        </clipPath>

        {subsystems.map((sub) => {
          const y = yIndex.get(sub);
          return (
            <g key={sub}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#1c2029" />
              <text x={4} y={y + 3}>{sub}</text>
            </g>
          );
        })}
        
        <g clipPath="url(#plot-area)">
          {visibleEvents.map((e, i) => {
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
        </g>
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
