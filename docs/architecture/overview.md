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

*   **Python CLI Package (`udev_plotter`):** Distributed via PyPI for easy installation.
    *   **Parser (`parser.py`):** Uses regular expressions to parse the multiline event format of `udevadm monitor` and extracts key properties (timestamp, source, action, subsystem, etc.).
    *   **Report Generator (`cli.py`):** Serializes the parsed events to JSON and uses Jinja2 templating to generate the report.
*   **Separated Frontend Assets (`templates/`):** 
    *   HTML, CSS, and modern JavaScript are maintained in separate, clean files.
    *   They are injected into a single, self-contained static HTML file by the CLI.
    *   This guarantees **100% local execution and strict data confidentiality**—no logs are ever uploaded to a remote server.
*   **Frontend UI:** Provides summary statistics, filterable bar charts, an interactive SVG timeline, and a searchable/sortable event table.
