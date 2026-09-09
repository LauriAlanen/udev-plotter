import argparse
import json
import webbrowser
import re
from pathlib import Path

from udev_plotter.parser import parse_log

def main():
    ap = argparse.ArgumentParser(description="Parse a udevadm monitor log and render it as an interactive HTML report.")
    ap.add_argument('logfile', help='path to the udevadm monitor log file')
    ap.add_argument('-o', '--output', help='output HTML path (default: <logfile>.html)')
    ap.add_argument('--no-open', action='store_true', help='do not open the report in a browser')
    args = ap.parse_args()

    log_path = Path(args.logfile)
    events = parse_log(log_path)
    if not events:
        raise SystemExit(f'No udev/kernel events found in {log_path}')

    out_path = Path(args.output) if args.output else log_path.with_suffix('.html')
    
    template_path = Path(__file__).parent / 'frontend_dist' / 'index.html'
    if not template_path.exists():
        raise SystemExit(f"Frontend build not found at {template_path}. Please build the frontend.")
    
    html = template_path.read_text(encoding='utf-8')
    
    meta = {
        'title': log_path.name,
        'count': len(events),
        'start': events[0]['t'] if events else 0,
        'end': events[-1]['t'] if events else 0,
    }
    
    events_json = json.dumps(events, separators=(',', ':')).replace('</', '<\\/')
    meta_json = json.dumps(meta).replace('</', '<\\/')
    
    html = re.sub(r'/\*UDEV_EVENTS\*/.*/\*UDEV_EVENTS\*/', events_json, html, count=1)
    html = re.sub(r'/\*UDEV_META\*/.*/\*UDEV_META\*/', meta_json, html, count=1)
    
    out_path.write_text(html, encoding='utf-8')
    print(f'Parsed {len(events)} events -> {out_path}')

    if not args.no_open:
        webbrowser.open(out_path.resolve().as_uri())

if __name__ == '__main__':
    main()
