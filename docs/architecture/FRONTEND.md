# Frontend Architecture

`udev-plotter` uses a modern React frontend to visualize the udev boot data. 

## Design Goals
- **Single File Output**: The tool generates a single, standalone HTML file that contains all data, styles, and scripts. It must work completely offline without CDN dependencies.
- **Maintainability**: The UI is split into modular React components.

## Build Process
The frontend is built using **Vite**. To maintain the single-file requirement, we use `vite-plugin-singlefile`. 
When you run `npm run build` in the `frontend/` directory, Vite bundles React, the application code, and CSS, and inlines everything into `src/udev_plotter/frontend_dist/index.html`.

## Data Injection
Instead of a traditional templating engine like Jinja2, the Python backend uses lightweight regex string replacement.
In `frontend/index.html`, there is a `<script>` tag:
```javascript
window.__UDEV_DATA__ = {
  events: /*UDEV_EVENTS*/[]/*UDEV_EVENTS*/,
  meta: /*UDEV_META*/{"title":"development","count":0,"start":0,"end":0}/*UDEV_META*/
};
```
The Python CLI reads the built HTML file and replaces the contents between `/*UDEV_EVENTS*/` and `/*UDEV_META*/` with actual JSON strings representing the parsed log data.

## Component Structure
- `App.jsx`: Main container, handles global state (filters, sorting) and data derivation (counting, filtering).
- `Filters.jsx`: Controls for text search and action toggles.
- `BarChart.jsx`: Reusable horizontal bar chart for subsystem and action distributions.
- `Histogram.jsx`: SVG-based event rate visualization over time.
- `Timeline.jsx`: SVG-based scatter plot of events over time grouped by subsystem.
- `Table.jsx`: Sortable data table showing raw event details.
