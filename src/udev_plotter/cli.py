import argparse
import json
import webbrowser
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

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
    
    template_dir = Path(__file__).parent / 'templates'
    
    # Render with Jinja2
    env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(['html', 'xml'])
    )
    
    # Load separate JS and CSS files to inject
    css_content = (template_dir / 'style.css').read_text()
    js_content = (template_dir / 'script.js').read_text()
    
    template = env.get_template("index.html.j2")
    
    meta = {
        'title': log_path.name,
        'count': len(events),
        'start': events[0]['t'] if events else 0,
        'end': events[-1]['t'] if events else 0,
    }
    
    # Serialize JSON safely
    events_json = json.dumps(events, separators=(',', ':')).replace('</', '<\\/')
    meta_json = json.dumps(meta).replace('</', '<\\/')
    
    html = template.render(
        css_content=css_content,
        js_content=js_content,
        events_json=events_json,
        meta_json=meta_json
    )
    
    out_path.write_text(html)
    print(f'Parsed {len(events)} events -> {out_path}')

    if not args.no_open:
        webbrowser.open(out_path.resolve().as_uri())

if __name__ == '__main__':
    main()
