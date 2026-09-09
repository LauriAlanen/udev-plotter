# ADR 0001: Migrate Frontend to React and Vite

## Status
Accepted

## Context
The previous frontend was implemented using vanilla JavaScript and rendered within a single Jinja2 template (`index.html.j2`). As the tool grew, the JavaScript file became dense, difficult to read, and hard to maintain or extend with new interactive features. The user requested to migrate to a modern, component-based architecture like React.

At the same time, the tool's core feature—generating a single, standalone, offline-capable HTML report file—had to be preserved. 

## Decision
We decided to:
1. Introduce a Vite-based React frontend in the `frontend/` directory.
2. Structure the UI into modular React components (`App`, `Filters`, `BarChart`, `Histogram`, `Timeline`, `Table`).
3. Use `vite-plugin-singlefile` to bundle the entire React application (JS and CSS) inline into a single `index.html` file at build time.
4. Replace Jinja2 templating with simple regular expression string replacement in Python (`cli.py`). The built `index.html` serves as a template, and Python injects the JSON data payloads into pre-defined comment blocks (`/*UDEV_EVENTS*/.../*UDEV_EVENTS*/`).

## Consequences
- **Positive**: The codebase is much more maintainable, readable, and scalable for future frontend enhancements.
- **Positive**: We completely removed the `Jinja2` dependency from the Python package.
- **Positive**: We maintained the offline, single-file HTML report capability.
- **Negative**: A Node.js environment is now required during development to build the frontend. The `npm run build` step must be executed before the Python package is published or tested locally.
