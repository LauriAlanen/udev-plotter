# 2. PyPI Package and Local HTML Generation

## Context
The previous prototype of `udev-plotter` was a monolithic Python script that combined parsing logic with a massive inline string of HTML/CSS/JS. As the tool evolves, this monolithic structure becomes difficult to maintain, test, and distribute. Furthermore, `udevadm monitor` logs from embedded devices can contain sensitive or proprietary hardware information, ruling out the use of a hosted cloud service for visualization.

## Decision
1.  **Distribution via PyPI:** We will package the tool as a standard Python package installable via `pipx` or `pip`. This provides a low-friction installation experience for embedded developers.
2.  **Local Static HTML Generation:** The CLI will parse logs locally and output a single, self-contained, interactive HTML file. This ensures absolute data confidentiality—logs never leave the user's machine.
3.  **Modern Templating (Jinja2):** We will use Jinja2 to separate the frontend code (HTML, CSS, modern JS) from the backend Python logic. The frontend assets will be maintained in separate, clean files and injected into the final HTML document at runtime.

## Consequences
*   **Pros:** Improved maintainability, distinct separation of concerns, modern frontend development workflow, zero data privacy risks, and simple installation for the target audience.
*   **Cons:** Introduces `Jinja2` as a Python dependency (minimal overhead) and slightly more complex package structure.
