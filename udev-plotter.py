#!/usr/bin/env python3
"""Parse a `udevadm monitor --property` log and render it as an interactive HTML report.

Usage:
    python3 udev_visualize.py udev-boot-monitor-5-weston.log
    python3 udev_visualize.py udev-boot-monitor-5-weston.log -o report.html

The output is a single self-contained HTML file (no external dependencies,
no internet connection required) with:
    - summary stats
    - bar charts of events by subsystem / action
    - an interactive timeline (swimlane) of events over boot time
    - a histogram of event rate over time
    - a searchable/filterable/sortable table of every event
"""
import argparse
import json
import re
import webbrowser
from pathlib import Path

HEADER_RE = re.compile(
    r'^(?P<src>UDEV|KERNEL)\s*\[\s*(?P<ts>[\d.]+)\]\s+'
    r'(?P<action>\S+)\s+(?P<devpath>\S+)\s*(?:\((?P<subsystem>[^)]*)\))?'
)
KV_RE = re.compile(r'^([A-Z0-9_]+)=(.*)$')


def parse_log(path):
    events = []
    cur = None

    def flush():
        if cur is not None:
            events.append(cur)

    with open(path, 'r', errors='replace') as f:
        for line in f:
            line = line.rstrip('\n')
            m = HEADER_RE.match(line)
            if m:
                flush()
                cur = {
                    'src': m.group('src'),
                    't': float(m.group('ts')),
                    'action': m.group('action'),
                    'devpath': m.group('devpath'),
                    'subsystem': m.group('subsystem') or '',
                }
                continue
            if not line.strip():
                flush()
                cur = None
                continue
            kv = KV_RE.match(line)
            if kv and cur is not None:
                key, val = kv.group(1), kv.group(2)
                if key == 'SEQNUM':
                    cur['seq'] = val
                elif key == 'INTERFACE':
                    cur['iface'] = val
                elif key == 'DRIVER':
                    cur['driver'] = val
                elif key == 'SUBSYSTEM' and not cur.get('subsystem'):
                    cur['subsystem'] = val
    flush()
    events.sort(key=lambda e: e['t'])
    return events


def build_html(events, title):
    data_json = json.dumps(events, separators=(',', ':')).replace('</', '<\\/')
    meta = {
        'title': title,
        'count': len(events),
        'start': events[0]['t'] if events else 0,
        'end': events[-1]['t'] if events else 0,
    }
    meta_json = json.dumps(meta).replace('</', '<\\/')
    html = HTML_TEMPLATE.replace('__EVENTS_JSON__', data_json).replace('__META_JSON__', meta_json)
    return html


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>udev event report</title>
<style>
  :root {
    --bg: #0f1115; --panel: #171a21; --border: #2a2f3a; --text: #e6e8ec; --muted: #9aa2af;
    --add: #22c55e; --remove: #ef4444; --change: #3b82f6; --bind: #a855f7;
    --unbind: #f97316; --move: #eab308; --online: #14b8a6; --offline: #6b7280; --other: #94a3b8;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 13px/1.4 -apple-system, Segoe UI, Roboto, sans-serif; }
  header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
  header h1 { font-size: 16px; margin: 0; }
  .stats { display: flex; gap: 18px; color: var(--muted); flex-wrap: wrap; }
  .stats b { color: var(--text); }
  main { padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
  .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
  .panel h2 { font-size: 13px; margin: 0 0 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .row { display: flex; gap: 16px; flex-wrap: wrap; }
  .row .panel { flex: 1; min-width: 320px; }
  .controls { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
  .controls input[type=text] { background: #0d0f13; border: 1px solid var(--border); color: var(--text); padding: 6px 10px; border-radius: 6px; min-width: 220px; }
  .chip-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { padding: 3px 9px; border-radius: 999px; border: 1px solid var(--border); cursor: pointer; font-size: 11px; user-select: none; color: var(--muted); }
  .chip.active { color: #0f1115; font-weight: 600; }
  .bar-row { display: flex; align-items: center; gap: 8px; margin: 3px 0; cursor: pointer; }
  .bar-label { width: 210px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
  .bar-track { flex: 1; background: #0d0f13; border-radius: 3px; overflow: hidden; height: 14px; }
  .bar-fill { height: 100%; background: #3b82f6; }
  .bar-count { width: 46px; text-align: right; color: var(--muted); }
  svg text { fill: var(--muted); font-size: 10px; }
  .tooltip { position: fixed; background: #1f242e; border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px;
    pointer-events: none; font-size: 11px; display: none; z-index: 10; max-width: 340px; white-space: pre; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--border); white-space: nowrap; }
  th { position: sticky; top: 0; background: var(--panel); cursor: pointer; color: var(--muted); }
  td.devpath { white-space: normal; word-break: break-all; }
  .table-wrap { max-height: 480px; overflow: auto; border: 1px solid var(--border); border-radius: 6px; }
  .action-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
  .muted { color: var(--muted); }
  .count-badge { color: var(--muted); font-size: 11px; margin-left: 8px; }
</style>
</head>
<body>
<header>
  <h1 id="title">udev event report</h1>
  <div class="stats">
    <span><b id="stat-count">0</b> events</span>
    <span><b id="stat-duration">0</b>s boot span</span>
    <span><b id="stat-subsystems">0</b> subsystems</span>
    <span><b id="stat-filtered">0</b> shown</span>
  </div>
</header>
<main>
  <div class="panel">
    <h2>Filters</h2>
    <div class="controls">
      <input id="search" type="text" placeholder="Search devpath / driver / interface...">
      <div class="chip-group" id="action-chips"></div>
      <span class="muted" id="subsystem-hint">Click a subsystem bar below to filter, click again to clear.</span>
    </div>
  </div>

  <div class="row">
    <div class="panel">
      <h2>Events by subsystem</h2>
      <div id="subsystem-bars"></div>
    </div>
    <div class="panel">
      <h2>Events by action</h2>
      <div id="action-bars"></div>
    </div>
  </div>

  <div class="panel">
    <h2>Event rate over time</h2>
    <svg id="histogram" width="100%" height="120"></svg>
  </div>

  <div class="panel">
    <h2>Timeline (hover a point for details)</h2>
    <svg id="timeline" width="100%" height="560"></svg>
  </div>

  <div class="panel">
    <h2>Event table <span class="count-badge" id="table-count"></span></h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th data-key="t">time (s)</th>
            <th data-key="src">src</th>
            <th data-key="action">action</th>
            <th data-key="subsystem">subsystem</th>
            <th data-key="devpath">devpath</th>
            <th data-key="iface">iface</th>
            <th data-key="driver">driver</th>
            <th data-key="seq">seq</th>
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>
  </div>
</main>
<div class="tooltip" id="tooltip"></div>

<script>
const EVENTS = __EVENTS_JSON__;
const META = __META_JSON__;

const ACTION_COLORS = {
  add: '#22c55e', remove: '#ef4444', change: '#3b82f6', bind: '#a855f7',
  unbind: '#f97316', move: '#eab308', online: '#14b8a6', offline: '#6b7280'
};
function colorFor(action) { return ACTION_COLORS[action] || '#94a3b8'; }

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

function renderActionChips(list) {
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
</script>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('logfile', help='path to the udevadm monitor log file')
    ap.add_argument('-o', '--output', help='output HTML path (default: <logfile>.html)')
    ap.add_argument('--no-open', action='store_true', help='do not open the report in a browser')
    args = ap.parse_args()

    log_path = Path(args.logfile)
    events = parse_log(log_path)
    if not events:
        raise SystemExit(f'No udev/kernel events found in {log_path}')

    out_path = Path(args.output) if args.output else log_path.with_suffix('.html')
    html = build_html(events, log_path.name)
    out_path.write_text(html)
    print(f'Parsed {len(events)} events -> {out_path}')

    if not args.no_open:
        webbrowser.open(out_path.resolve().as_uri())


if __name__ == '__main__':
    main()
