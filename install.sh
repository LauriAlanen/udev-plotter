#!/bin/sh
set -e

echo "Installing udev-monitor service..."

# Ensure we're root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root." >&2
    exit 1
fi

# Install wrapper script
install -D -m 755 service/udev-monitor.sh /usr/local/bin/udev-monitor.sh

# Detect init system
if command -v systemctl >/dev/null 2>&1 && systemctl | grep -q '\-\.mount'; then
    echo "Detected systemd. Installing systemd unit..."
    install -D -m 644 service/udev-monitor.service /etc/systemd/system/udev-monitor.service
    systemctl daemon-reload
    systemctl enable udev-monitor.service
    systemctl start udev-monitor.service
elif [ -d /etc/init.d ]; then
    echo "Detected SysVinit. Installing init script..."
    install -D -m 755 service/udev-monitor.sysvinit /etc/init.d/udev-monitor
    if command -v update-rc.d >/dev/null 2>&1; then
        update-rc.d udev-monitor defaults S
    elif command -v rc-update >/dev/null 2>&1; then
        rc-update add udev-monitor boot
    fi
    /etc/init.d/udev-monitor start
else
    echo "Unknown init system. Wrapper script installed to /usr/local/bin/udev-monitor.sh"
    echo "Please configure your init system manually to run this script at boot."
    exit 1
fi

echo "Installation complete."
