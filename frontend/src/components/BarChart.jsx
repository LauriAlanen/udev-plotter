import React from 'react';

export default function BarChart({ data, colorFn, activeKey, onClick }) {
  const max = data.length ? data[0][1] : 1;
  
  return (
    <div>
      {data.map(([label, count]) => {
        const pct = (count / max * 100).toFixed(1);
        const opacity = (activeKey && label !== activeKey) ? 0.45 : 1;
        
        return (
          <div 
            key={label} 
            className="bar-row" 
            style={{ opacity }} 
            onClick={() => onClick(label)}
          >
            <div className="bar-label" title={label}>{label}</div>
            <div className="bar-track">
              <div 
                className="bar-fill" 
                style={{ width: `${pct}%`, background: colorFn(label) }}
              />
            </div>
            <div className="bar-count">{count}</div>
          </div>
        );
      })}
    </div>
  );
}
