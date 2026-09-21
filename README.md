# udev-plotter
A lightweight visualization tool that parses raw `udevadm monitor` output into an interactive, offline HTML report. 

## Why?
Reading raw `udevadm monitor` logs can be a bit time consuming and confusing as many things can happen in parallel, this tool gives a visual way for visual people to understand their udevadm monitor logs.

`udev-plotter` turns those massive log dumps into a timeline so you can visually spot bottlenecks and optimize your boot time or udev rules. 

## Setup

### 1. Install the CLI tool
You can install the python package using `pip` or `pipx`. Running from the repository root:
```bash
pipx install .
# or using a virtual environment
python3 -m venv venv
source venv/bin/activate
pip install .
```

### 2. Set up the boot log collector (Optional)
To capture events during the actual system boot sequence, you'll need a background service. We provide an install script that sets up a simple systemd/SysVinit service to capture `udevadm monitor` output:

```bash
sudo ./install.sh
```
This will start recording boot events to `/var/log/udev-boot-monitor.log`. You can remove it later by running `sudo ./uninstall.sh`.

## Usage

Once you have a log file (either from the boot service or by manually running `udevadm monitor > my-log.log`), feed it to the plotter:

```bash
udev-plotter /var/log/udev-boot-monitor.log
```
By default, this generates an interactive HTML report in the `output/` folder. Just open the resulting `.html` file in any web browser.

## Filtering Options

The `udev-plotter` UI provides several ways to drill down into the noise:
* **Text Search**: Type into the search bar to instantly filter events by `devpath`, `driver`, or `interface`.
* **Event Source Toggle**: Switch between raw **KERNEL** events, processed **UDEV** events, or view **Both** simultaneously to trace how kernel events are handled by user-space.
* **Action Chips**: Toggle specific udev actions (e.g., `add`, `remove`, `bind`, `change`) by clicking the colored action chips.
* **Subsystem Histogram**: The bar chart isn't just for show, click any subsystem bar (like `block`, `usb`, or `net`) to exclusively filter the timeline and table to that subsystem. Click it again to clear the filter.

## Images speak more than words....
<img width="3393" height="932" alt="image" src="https://github.com/user-attachments/assets/fea13e15-d936-4ef1-9fc1-f68ea5c4904d" />
<img width="3350" height="1175" alt="image" src="https://github.com/user-attachments/assets/0562c3b3-2ba8-4b3f-bebf-de38d8bee869" />
