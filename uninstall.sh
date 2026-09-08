#!/bin/sh
set -e

echo "Uninstalling udev-monitor service..."

# Ensure we're root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root." >&2
    exit 1
fi

if command -v systemctl >/dev/null 2>&1 && systemctl | grep -q '\-\.mount'; then
    systemctl stop udev-monitor.service || true
    systemctl disable udev-monitor.service || true
    rm -f /etc/systemd/system/udev-monitor.service
    systemctl daemon-reload
elif [ -f /etc/init.d/udev-monitor ]; then
    /etc/init.d/udev-monitor stop || true
    if command -v update-rc.d >/dev/null 2>&1; then
        update-rc.d -f udev-monitor remove
    elif command -v rc-update >/dev/null 2>&1; then
        rc-update del udev-monitor boot
    fi
    rm -f /etc/init.d/udev-monitor
fi

rm -f /usr/local/bin/udev-monitor.sh
echo "Uninstallation complete."
