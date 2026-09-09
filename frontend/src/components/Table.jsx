import React, { useState, useMemo } from 'react';
import { colorFor } from '../App.jsx';

export default function Table({ events }) {
  const [sortKey, setSortKey] = useState('t');
  const [sortAsc, setSortAsc] = useState(true);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (av === undefined) av = '';
      if (bv === undefined) bv = '';
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    }).slice(0, 2000);
  }, [events, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

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
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th 
                key={col.key} 
                onClick={() => handleSort(col.key)}
                style={{ cursor: 'pointer' }}
              >
                {col.label} {sortKey === col.key ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedEvents.map((e, i) => (
            <tr key={i}>
              <td>{e.t.toFixed(6)}</td>
              <td>{e.src}</td>
              <td>
                <span 
                  className="action-dot" 
                  style={{ background: colorFor(e.action) }}
                ></span>
                {e.action}
              </td>
              <td>{e.subsystem || ''}</td>
              <td className="devpath">{e.devpath}</td>
              <td>{e.iface || ''}</td>
              <td>{e.driver || ''}</td>
              <td>{e.seq || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
