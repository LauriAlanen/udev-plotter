import React, { useState, useMemo } from 'react';
import Filters from './components/Filters.jsx';
import BarChart from './components/BarChart.jsx';
import Histogram from './components/Histogram.jsx';
import Timeline from './components/Timeline.jsx';
import Table from './components/Table.jsx';

const ACTION_COLORS = {
  add: '#22c55e', remove: '#ef4444', change: '#3b82f6', bind: '#a855f7',
  unbind: '#f97316', move: '#eab308', online: '#14b8a6', offline: '#6b7280'
};

export const colorFor = (action) => ACTION_COLORS[action] || '#94a3b8';

function counts(list, key) {
  const m = new Map();
  for (const e of list) {
    const k = e[key] || '(none)';
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export default function App() {
  const data = window.__UDEV_DATA__ || { events: [], meta: { title: 'dev', count: 0, start: 0, end: 0 } };
  const EVENTS = data.events;
  const META = data.meta;

  const [subsystemFilter, setSubsystemFilter] = useState(null);
  const [actionFilter, setActionFilter] = useState(new Set());
  const [searchText, setSearchText] = useState('');
  const [srcFilter, setSrcFilter] = useState('ALL'); // 'ALL', 'KERNEL', 'UDEV'

  const filteredEvents = useMemo(() => {
    return EVENTS.filter(e => {
      if (srcFilter !== 'ALL' && e.src !== srcFilter) return false;
      if (subsystemFilter && e.subsystem !== subsystemFilter) return false;
      if (actionFilter.size && !actionFilter.has(e.action)) return false;
      if (searchText) {
        const hay = (e.devpath + ' ' + (e.driver||'') + ' ' + (e.iface||'') + ' ' + (e.subsystem||'')).toLowerCase();
        if (!hay.includes(searchText)) return false;
      }
      return true;
    });
  }, [EVENTS, srcFilter, subsystemFilter, actionFilter, searchText]);

  const toggleAction = (a) => {
    const next = new Set(actionFilter);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    setActionFilter(next);
  };

  const eventsForSubsystemFilter = useMemo(() => {
    return EVENTS.filter(e => {
      if (srcFilter !== 'ALL' && e.src !== srcFilter) return false;
      if (actionFilter.size && !actionFilter.has(e.action)) return false;
      if (searchText) {
        const hay = (e.devpath + ' ' + (e.driver||'') + ' ' + (e.iface||'') + ' ' + (e.subsystem||'')).toLowerCase();
        if (!hay.includes(searchText)) return false;
      }
      return true;
    });
  }, [EVENTS, srcFilter, actionFilter, searchText]);

  const eventsForActionFilter = useMemo(() => {
    return EVENTS.filter(e => {
      if (srcFilter !== 'ALL' && e.src !== srcFilter) return false;
      if (subsystemFilter && e.subsystem !== subsystemFilter) return false;
      if (searchText) {
        const hay = (e.devpath + ' ' + (e.driver||'') + ' ' + (e.iface||'') + ' ' + (e.subsystem||'')).toLowerCase();
        if (!hay.includes(searchText)) return false;
      }
      return true;
    });
  }, [EVENTS, srcFilter, subsystemFilter, searchText]);

  const availableSubsystems = useMemo(() => new Set(eventsForSubsystemFilter.map(e => e.subsystem)), [eventsForSubsystemFilter]);
  const availableActions = useMemo(() => new Set(eventsForActionFilter.map(e => e.action)), [eventsForActionFilter]);

  const subsystemCounts = useMemo(() => counts(EVENTS, 'subsystem').slice(0, 20), [EVENTS]);
  const actionCounts = useMemo(() => counts(EVENTS, 'action'), [EVENTS]);
  const totalSubsystems = useMemo(() => new Set(EVENTS.map(e => e.subsystem)).size, [EVENTS]);

  return (
    <>
      <header>
        <h1 id="title">{META.title}</h1>
        <div className="stats">
          <span><b>{META.count}</b> events</span>
          <span><b>{((META.end || 0) - (META.start || 0)).toFixed(2)}</b>s boot span</span>
          <span><b>{totalSubsystems}</b> subsystems</span>
          <span><b>{filteredEvents.length}</b> shown</span>
        </div>
      </header>
      <main>
        <div className="panel">
          <h2>Filters</h2>
          <Filters 
            events={EVENTS} 
            searchText={searchText} 
            setSearchText={setSearchText} 
            actionFilter={actionFilter} 
            toggleAction={toggleAction}
            availableActions={availableActions}
            srcFilter={srcFilter}
            setSrcFilter={setSrcFilter}
          />
        </div>

        <div className="row">
          <div className="panel">
            <h2>Events by subsystem</h2>
            <BarChart 
              data={subsystemCounts} 
              colorFn={() => '#3b82f6'} 
              activeKey={subsystemFilter}
              availableSet={availableSubsystems}
              onClick={(label) => setSubsystemFilter(prev => prev === label ? null : label)} 
            />
          </div>
          <div className="panel">
            <h2>Events by action</h2>
            <BarChart 
              data={actionCounts} 
              colorFn={colorFor} 
              activeSet={actionFilter}
              availableSet={availableActions}
              onClick={toggleAction} 
            />
          </div>
        </div>

        <div className="panel">
          <h2>Event rate over time</h2>
          <Histogram events={filteredEvents} meta={META} />
        </div>

        <div className="panel">
          <h2>Timeline (hover a point for details)</h2>
          <Timeline events={filteredEvents} allEvents={EVENTS} meta={META} />
        </div>

        <div className="panel">
          <h2>Event table <span className="count-badge">({filteredEvents.length})</span></h2>
          <Table events={filteredEvents} />
        </div>
      </main>
    </>
  );
}
