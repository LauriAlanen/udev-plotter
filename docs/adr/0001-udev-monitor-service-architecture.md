# ADR 0001: Udev Monitor Service Architecture

## Context
We need a robust baseline service to capture `udevadm monitor` output for `udev-plotter`. It must be highly portable across both desktop and resource-constrained embedded environments, resilient against failures, and easy to deploy. Since the service starts extremely early during boot, writing to disk poses read-only filesystem issues and flash memory wear on embedded devices.

## Decision
1. **Service Wrapper**: We implemented a lightweight POSIX shell script (`udev-monitor.sh`) to wrap the `udevadm monitor` command. 
2. **Log Location**: Logs are written to `/run/udev-plotter/udev-boot-monitor.log`. `/run` is a `tmpfs` (RAM disk), ensuring it is writable immediately upon kernel initialization without blocking IO or wearing out embedded flash storage. The script checks for directory availability and falls back to `/tmp` if necessary.
3. **Init System Flexibility**: 
   - **systemd**: Primary target, leveraging a `.service` unit with `Restart=always` and `RestartSec=3` for high redundancy.
   - **SysVinit / OpenRC**: Fallback provided via a standard `/etc/init.d/` script using `start-stop-daemon`.
4. **Deployment**: Self-contained POSIX shell scripts (`install.sh` and `uninstall.sh`) detect the host's init system automatically and install the necessary components.

## Consequences
- **Pros**: 
  - Zero dependencies beyond a POSIX shell.
  - Immune to early-boot read-only filesystem errors.
  - No flash wear on embedded devices.
- **Cons**: 
  - Logs are volatile and lost on reboot. Since `udev-plotter` analyzes the current boot session, this is deemed an acceptable trade-off over flash wear and IO bottlenecks.
  - Log rotation is only evaluated at service startup (10MB limit), though RAM limits are protected by `tmpfs` constraints implicitly.
