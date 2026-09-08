#!/bin/sh
# udev-monitor.sh - Wrapper for udevadm monitor

LOG_DIR="/run/udev-plotter"
LOG_FILE="$LOG_DIR/udev-boot-monitor.log"
MAX_LOG_SIZE=$((10 * 1024 * 1024)) # 10MB limit

# Create directory and fallback to /tmp if /run is unavailable
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR" || LOG_FILE="/tmp/udev-boot-monitor.log"
fi

# Ensure log is writable
touch "$LOG_FILE" 2>/dev/null || exit 1
chmod 644 "$LOG_FILE" 2>/dev/null

# Verify udevadm is available
UDEVADM=$(command -v udevadm || echo "/sbin/udevadm")
if [ ! -x "$UDEVADM" ]; then
    echo "Error: udevadm not found or not executable" >> "$LOG_FILE"
    exit 1
fi

# Basic size check at startup to protect embedded systems
if [ -f "$LOG_FILE" ]; then
    CURRENT_SIZE=$(wc -c < "$LOG_FILE")
    if [ "$CURRENT_SIZE" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
    fi
fi

# Run udevadm monitor and append to log
exec "$UDEVADM" monitor --kernel --udev --property >> "$LOG_FILE" 2>&1
