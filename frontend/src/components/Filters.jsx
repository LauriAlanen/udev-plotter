import React, { useMemo } from 'react';
import { colorFor } from '../App.jsx';

export default function Filters({ events, searchText, setSearchText, actionFilter, toggleAction, availableActions }) {
  const allActions = useMemo(() => [...new Set(events.map(e => e.action))].sort(), [events]);

  return (
    <div className="controls">
      <input 
        type="text" 
        placeholder="Search devpath / driver / interface..." 
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
      />
      <div className="chip-group">
        {allActions.map(a => {
          const active = actionFilter.has(a);
          const isAvailable = !availableActions || availableActions.has(a);
          const isOnlyAvailable = isAvailable && availableActions && availableActions.size === 1 && !active;
          const isClickable = active || (isAvailable && !isOnlyAvailable);
          
          return (
            <span 
              key={a}
              className={`chip ${active ? 'active' : ''}`}
              style={{
                borderColor: colorFor(a),
                background: active ? colorFor(a) : 'transparent',
                opacity: isAvailable ? 1 : 0.4,
                cursor: isClickable ? 'pointer' : 'default',
                pointerEvents: isClickable ? 'auto' : 'none'
              }}
              onClick={() => {
                if (isClickable) toggleAction(a);
              }}
            >
              {a}
            </span>
          );
        })}
      </div>
      <span className="muted">Click a subsystem bar below to filter, click again to clear.</span>
    </div>
  );
}
