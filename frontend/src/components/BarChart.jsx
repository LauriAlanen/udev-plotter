import React from 'react';

export default function BarChart({ data, colorFn, activeKey, activeSet, availableSet, onClick }) {
  const max = data.length ? data[0][1] : 1;
  
  return (
    <div>
      {data.map(([label, count]) => {
        const pct = (count / max * 100).toFixed(1);
        const isAvailable = !availableSet || availableSet.has(label);
        const active = (activeSet ? activeSet.has(label) : label === activeKey);
        const isOnlyAvailable = isAvailable && availableSet && availableSet.size === 1 && !active;
        const isClickable = active || (isAvailable && !isOnlyAvailable);
        
        const hasActive = activeSet ? activeSet.size > 0 : !!activeKey;
        let opacity = (hasActive && !active) ? 0.45 : 1;
        if (!isAvailable && !hasActive) opacity = 0.2; // Dim unavailable items
        if (!isAvailable && hasActive) opacity = 0.1;
        
        return (
          <div 
            key={label} 
            className="bar-row" 
            style={{ 
              opacity, 
              cursor: isClickable ? 'pointer' : 'default',
              pointerEvents: isClickable ? 'auto' : 'none'
            }} 
            onClick={() => {
              if (isClickable) onClick(label);
            }}
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
