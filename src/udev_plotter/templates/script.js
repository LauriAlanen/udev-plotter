const ACTION_COLORS = {
  add: '#22c55e', remove: '#ef4444', change: '#3b82f6', bind: '#a855f7',
  unbind: '#f97316', move: '#eab308', online: '#14b8a6', offline: '#6b7280'
};

const colorFor = (action) => ACTION_COLORS[action] || '#94a3b8';

document.getElementById('title').textContent = META.title;
document.getElementById('stat-count').textContent = META.count;
document.getElementById('stat-duration').textContent = (META.end - META.start).toFixed(2);

let subsystemFilter = null;
let actionFilter = new Set();
let searchText = '';
let sortKey = 't';
let sortAsc = true;

function applyFilters() {
  return EVENTS.filter(e => {
    if (subsystemFilter && e.subsystem !== subsystemFilter) return false;
    if (actionFilter.size && !actionFilter.has(e.action)) return false;
    if (searchText) {
      const hay = (e.devpath + ' ' + (e.driver||'') + ' ' + (e.iface||'') + ' ' + e.subsystem).toLowerCase();
      if (!hay.includes(searchText)) return false;
    }
    return true;
  });
}

function counts(list, key) {
  const m = new Map();
  for (const e of list) {
    const k = e[key] || '(none)';
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function renderBars(containerId, data, colorFn, onClick, activeKey) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  const max = data.length ? data[0][1] : 1;
  for (const [label, count] of data) {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.style.opacity = (activeKey && label !== activeKey) ? 0.45 : 1;
    row.innerHTML = `
      <div class="bar-label" title="${label}">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count/max*100).toFixed(1)}%;background:${colorFn(label)}"></div></div>
      <div class="bar-count">${count}</div>`;
    row.onclick = () => onClick(label);
    el.appendChild(row);
  }
}

function renderActionChips() {
  const allActions = [...new Set(EVENTS.map(e => e.action))].sort();
  const el = document.getElementById('action-chips');
  el.innerHTML = '';
  for (const a of allActions) {
    const chip = document.createElement('span');
    const active = actionFilter.has(a);
    chip.className = 'chip' + (active ? ' active' : '');
    chip.style.borderColor = colorFor(a);
    if (active) chip.style.background = colorFor(a);
    chip.textContent = a;
    chip.onclick = () => {
      if (actionFilter.has(a)) actionFilter.delete(a); else actionFilter.add(a);
      renderAll();
    };
    el.appendChild(chip);
  }
}

function renderHistogram(list) {
  const svg = document.getElementById('histogram');
  svg.innerHTML = '';
  if (!list.length) return;
  const w = svg.clientWidth || 900, h = 120, pad = { l: 30, r: 10, t: 6, b: 18 };
  const t0 = META.start, t1 = META.end;
  const buckets = 80;
  const span = Math.max(t1 - t0, 0.001);
  const counts = new Array(buckets).fill(0);
  for (const e of list) {
    let idx = Math.floor((e.t - t0) / span * buckets);
    if (idx >= buckets) idx = buckets - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }
  const max = Math.max(...counts, 1);
  const bw = (w - pad.l - pad.r) / buckets;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  let s = '';
  for (let i = 0; i < buckets; i++) {
    const bh = (counts[i] / max) * (h - pad.t - pad.b);
    const x = pad.l + i * bw;
    const y = h - pad.b - bh;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw-1).toFixed(1)}" height="${bh.toFixed(1)}" fill="#3b82f6" opacity="0.75"><title>${(t0 + i*span/buckets).toFixed(2)}s: ${counts[i]} events</title></rect>`;
  }
  s += `<line x1="${pad.l}" y1="${h-pad.b}" x2="${w-pad.r}" y2="${h-pad.b}" stroke="#2a2f3a"/>`;
  s += `<text x="${pad.l}" y="${h-4}">${t0.toFixed(1)}s</text>`;
  s += `<text x="${w-pad.r-30}" y="${h-4}">${t1.toFixed(1)}s</text>`;
  svg.innerHTML = s;
}

function renderTimeline(list) {
  const svg = document.getElementById('timeline');
  svg.innerHTML = '';
  if (!list.length) return;
  const subsystems = [...new Set(list.map(e => e.subsystem || '(none)'))].sort();
  const w = svg.clientWidth || 900, rowH = 16, pad = { l: 190, r: 20, t: 10, b: 24 };
  const h = pad.t + pad.b + subsystems.length * rowH;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('height', h);
  const t0 = META.start, t1 = META.end;
  const span = Math.max(t1 - t0, 0.001);
  const xw = w - pad.l - pad.r;
  const yIndex = new Map(subsystems.map((s, i) => [s, i]));
  let s = '';
  subsystems.forEach((sub, i) => {
    const y = pad.t + i * rowH + rowH / 2;
    s += `<line x1="${pad.l}" y1="${y}" x2="${w-pad.r}" y2="${y}" stroke="#1c2029"/>`;
    s += `<text x="4" y="${y+3}">${sub}</text>`;
  });
  for (const e of list) {
    const x = pad.l + ((e.t - t0) / span) * xw;
    const y = pad.t + yIndex.get(e.subsystem || '(none)') * rowH + rowH / 2;
    s += `<circle class="pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${colorFor(e.action)}" data-i="${EVENTS.indexOf(e)}"/>`;
  }
  svg.innerHTML = s;
  const tooltip = document.getElementById('tooltip');
  svg.querySelectorAll('circle.pt').forEach(c => {
    c.addEventListener('mousemove', (ev) => {
      const e = EVENTS[+c.dataset.i];
      tooltip.style.display = 'block';
      tooltip.style.left = (ev.clientX + 14) + 'px';
      tooltip.style.top = (ev.clientY + 14) + 'px';
      tooltip.textContent =
        `t=${e.t.toFixed(6)}s  ${e.src}\n` +
        `action:    ${e.action}\n` +
        `subsystem: ${e.subsystem}\n` +
        `devpath:   ${e.devpath}\n` +
        (e.iface ? `iface:     ${e.iface}\n` : '') +
        (e.driver ? `driver:    ${e.driver}\n` : '') +
        (e.seq ? `seq:       ${e.seq}` : '');
    });
    c.addEventListener('mouseleave', () => tooltip.style.display = 'none');
  });
}

function renderTable(list) {
  document.getElementById('table-count').textContent = `(${list.length})`;
  const sorted = [...list].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (av === undefined) av = '';
    if (bv === undefined) bv = '';
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });
  const body = document.getElementById('table-body');
  const rows = sorted.slice(0, 2000).map(e => `
    <tr>
      <td>${e.t.toFixed(6)}</td>
      <td>${e.src}</td>
      <td><span class="action-dot" style="background:${colorFor(e.action)}"></span>${e.action}</td>
      <td>${e.subsystem||''}</td>
      <td class="devpath">${e.devpath}</td>
      <td>${e.iface||''}</td>
      <td>${e.driver||''}</td>
      <td>${e.seq||''}</td>
    </tr>`).join('');
  body.innerHTML = rows;
}

function renderAll() {
  const filtered = applyFilters();
  document.getElementById('stat-filtered').textContent = filtered.length;
  renderBars('subsystem-bars', counts(EVENTS, 'subsystem').slice(0, 20), () => '#3b82f6',
    (label) => { subsystemFilter = (subsystemFilter === label) ? null : label; renderAll(); }, subsystemFilter);
  renderBars('action-bars', counts(EVENTS, 'action'), colorFor,
    (label) => { if (actionFilter.has(label)) actionFilter.delete(label); else actionFilter.add(label); renderAll(); },
    actionFilter.size === 1 ? [...actionFilter][0] : null);
  renderActionChips();
  renderHistogram(filtered);
  renderTimeline(filtered);
  renderTable(filtered);
}

document.getElementById('search').addEventListener('input', (e) => {
  searchText = e.target.value.toLowerCase();
  renderAll();
});
document.querySelectorAll('th[data-key]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.key;
    if (sortKey === key) sortAsc = !sortAsc; else { sortKey = key; sortAsc = true; }
    renderTable(applyFilters());
  });
});

document.getElementById('stat-subsystems').textContent = new Set(EVENTS.map(e => e.subsystem)).size;
renderAll();
window.addEventListener('resize', renderAll);
