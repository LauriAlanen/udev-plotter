import re

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
