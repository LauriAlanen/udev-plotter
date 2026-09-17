import React, { useState, useMemo, useRef, useEffect } from 'react';
import { colorFor } from '../App.jsx';

const ROW_HEIGHT = 29; // approximate height of a table row in this theme
const OVERSCAN = 15; // number of extra rows to render above and below the visible area

export default function Table({ events }) {
  const [sortKey, setSortKey] = useState('t');
  const [sortAsc, setSortAsc] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Reset scroll when data or sort changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events, sortKey, sortAsc]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      
      if (av === undefined || av === null) av = '';
      if (bv === undefined || bv === null) bv = '';

      if (sortKey === 'seq') {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      }

      if (av === '' && bv !== '') return 1;
      if (av !== '' && bv === '') return -1;

      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      
      if (a.t !== b.t) return a.t < b.t ? -1 : 1;
      return 0;
    });
  }, [events, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const onScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Calculate visible range for virtual scrolling
  const viewportHeight = 480; // matches max-height of .table-wrap in css
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    sortedEvents.length,
    Math.floor((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN
  );

  const visibleEvents = sortedEvents.slice(startIndex, endIndex);
  
  // Calculate padding to simulate the actual scrollbar height
  const topPadding = startIndex * ROW_HEIGHT;
  const bottomPadding = Math.max(0, (sortedEvents.length - endIndex) * ROW_HEIGHT);

  const columns = [
    { key: 't', label: 'time (s)' },
    { key: 'src', label: 'src' },
    { key: 'action', label: 'action' },
    { key: 'subsystem', label: 'subsystem' },
    { key: 'devpath', label: 'devpath' },
    { key: 'iface', label: 'iface' },
    { key: 'driver', label: 'driver' },
    { key: 'seq', label: 'seq' }
  ];

  return (
    <div 
      className="table-wrap" 
      ref={containerRef} 
      onScroll={onScroll} 
      style={{ overflowY: 'auto', maxHeight: `${viewportHeight}px`, position: 'relative' }}
    >
      <table style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th 
                key={col.key} 
                onClick={() => handleSort(col.key)}
                style={{ cursor: 'pointer', position: 'sticky', top: 0, zIndex: 2 }}
              >
                {col.label} {sortKey === col.key ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topPadding > 0 && (
            <tr style={{ height: `${topPadding}px` }}>
              <td colSpan={8} style={{ padding: 0, border: 'none' }}></td>
            </tr>
          )}
          {visibleEvents.map((e, i) => (
            <tr key={startIndex + i} style={{ height: `${ROW_HEIGHT}px` }}>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.t.toFixed(6)}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.src}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span 
                  className="action-dot" 
                  style={{ background: colorFor(e.action) }}
                ></span>
                {e.action}
              </td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.subsystem || ''}</td>
              <td className="devpath" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.devpath}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.iface || ''}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.driver || ''}</td>
              <td style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.seq || ''}</td>
            </tr>
          ))}
          {bottomPadding > 0 && (
            <tr style={{ height: `${bottomPadding}px` }}>
              <td colSpan={8} style={{ padding: 0, border: 'none' }}></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
