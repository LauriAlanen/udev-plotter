# udev-plotter Architecture Overview

`udev-plotter` is a dual-component system designed to capture udev events during system boot and visualize them to identify bottlenecks or issues.

## 1. Data Collection (Service)
**Goal:** Capture high-fidelity kernel and udev events from the earliest possible stage of system boot.

*   **Wrapper Script (`service/udev-monitor.sh`):** A lightweight shell script that executes `udevadm monitor --kernel --udev --property` and streams the output to a log file (defaulting to `/run/udev-plotter/udev-boot-monitor.log`, falling back to `/tmp`). It includes basic log rotation (10MB limit) to protect storage on embedded devices.
*   **Init System Integration:** The project provides integration for different init systems to ensure the collection starts early in the boot process.
    *   **systemd:** `service/udev-monitor.service` (runs as a systemd unit).
    *   **SysVinit:** `service/udev-monitor.sysvinit` (runs as an init script).
*   **Installer (`install.sh` / `uninstall.sh`):** Handles the deployment of the wrapper script and the appropriate init system configuration based on the host OS.

## 2. Visualization & Analysis (Generator)
**Goal:** Parse the raw log output and generate an interactive, self-contained report for human analysis.

*   **Parser (`udev-plotter.py`):** A standalone Python script that reads the generated log file.
    *   It uses regular expressions to parse the multiline event format of `udevadm monitor`.
    *   It extracts key properties like timestamp, source (KERNEL/UDEV), action, device path, subsystem, sequence number, driver, etc.
*   **Report Generator:** The parsed events are serialized to JSON and embedded directly into a static HTML template contained within `udev-plotter.py`.
    *   The output is a single, self-contained HTML file requiring no external dependencies or internet connection.
*   **Frontend UI:** The embedded HTML/JS/CSS provides:
    *   Summary statistics.
    *   Filterable bar charts for subsystems and actions.
    *   An interactive timeline (swimlane) built with SVG.
    *   A searchable and sortable data table of all events.
