# Map and Geolocation Architecture

## 1. Basemap Implementation

- **Map Engine**: Leaflet via `react-leaflet` with client-side dynamic import (`ssr: false`).
- **Tile Server**: OpenStreetMap standard raster tiles with full attribution.
- **Default Focus**: Chennai, Tamil Nadu (`[13.0418, 80.2430]`, zoom level 12).
- **Extensibility**: City coordinates are configurable via `CITY_CONFIG` in `src/domain/config.ts` (supports switching to Coimbatore seamlessly).

## 2. Marker Dynamic Synchronization

Every affected community is rendered as a custom interactive marker:
- **Color**: Derived strictly from the priority category:
  - Critical (80–100): Dark Red (`#B42318`)
  - High (60–79.9): Red (`#E04444`)
  - Moderate (40–59.9): Amber (`#D99118`)
  - Low (0–39.9): Green (`#23865B`)
- **Bidirectional Sync**:
  - Clicking a marker selects the area in the global store, opens the detail drawer, and scrolls the table.
  - Selecting an area in the table invokes `map.flyTo([lat, lng], 14)` and highlights the corresponding marker.
- **Accessibility Alternative**: A complete screen-reader accessible tabular view (`MapTextAlternative`) is rendered alongside the map.
