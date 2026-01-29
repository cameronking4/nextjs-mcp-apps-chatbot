# Interactive Data Visualizer - MCP Tool PRD

## Overview

Transform raw data (CSV, JSON, arrays) into interactive, explorable charts and graphs directly within the chat. Users can switch chart types, filter data, zoom, and export visualizations.

## Value Proposition

- **Instant insights**: Turn data into visuals without external tools
- **Interactive exploration**: Filter, zoom, hover for details
- **AI-powered analysis**: "What trends do you see?" with visual context
- **Export ready**: Download charts for presentations/reports

---

## Tool Definition

### Primary Tool: `data-visualizer`

**Description**: Create interactive data visualizations from provided data.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "data": {
      "oneOf": [
        {
          "type": "array",
          "description": "Array of data objects",
          "items": { "type": "object" }
        },
        {
          "type": "string",
          "description": "CSV string or JSON string"
        }
      ]
    },
    "chartType": {
      "type": "string",
      "enum": ["bar", "line", "pie", "donut", "scatter", "area", "heatmap", "treemap", "funnel", "radar"],
      "default": "bar",
      "description": "Initial chart type"
    },
    "xAxis": {
      "type": "string",
      "description": "Field name for X axis / categories"
    },
    "yAxis": {
      "type": "string",
      "description": "Field name for Y axis / values"
    },
    "series": {
      "type": "array",
      "description": "Multiple series configuration",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "field": { "type": "string" },
          "color": { "type": "string" },
          "type": { "type": "string" }
        }
      }
    },
    "title": {
      "type": "string",
      "description": "Chart title"
    },
    "options": {
      "type": "object",
      "properties": {
        "stacked": { "type": "boolean" },
        "horizontal": { "type": "boolean" },
        "showLegend": { "type": "boolean", "default": true },
        "showGrid": { "type": "boolean", "default": true },
        "animated": { "type": "boolean", "default": true },
        "colors": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "required": ["data"]
}
```

### App-Only Tools (called from UI):

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `viz-change-type` | Switch chart type | `{ chartType }` |
| `viz-filter-data` | Apply data filters | `{ filters: [{ field, operator, value }] }` |
| `viz-sort-data` | Sort the data | `{ field, direction }` |
| `viz-export` | Export visualization | `{ format: "png" \| "svg" \| "csv" \| "json" }` |
| `viz-aggregate` | Apply aggregation | `{ groupBy, aggregate: "sum" \| "avg" \| "count" \| "min" \| "max" }` |
| `viz-add-series` | Add another data series | `{ field, name?, color? }` |

---

## UI Features

### Chart Area
- Responsive chart container
- Hover tooltips with data values
- Click to select data points
- Zoom & pan (mouse wheel, drag)
- Crosshair for precise reading

### Chart Type Selector
- Visual icons for each chart type
- Grouped: Basic, Distribution, Comparison, Part-to-whole
- Smart suggestions based on data shape

### Data Panel (collapsible)
- Data table preview
- Column type indicators
- Sort by clicking headers
- Quick filters per column
- Show/hide columns

### Controls Toolbar
- Chart type dropdown
- X/Y axis selectors
- Color palette picker
- Toggle: legend, grid, labels
- Stacked/grouped toggle (for bar/area)

### Export Options
- Download as PNG (current view)
- Download as SVG (vector)
- Export data as CSV
- Copy chart to clipboard
- Embed code generation

### Interactivity
- **Hover**: Tooltip with exact values
- **Click**: Select/highlight data point
- **Drag**: Pan the chart (when zoomed)
- **Scroll**: Zoom in/out
- **Double-click**: Reset zoom
- **Legend click**: Toggle series visibility

---

## Supported Chart Types

| Type | Best For | Data Shape |
|------|----------|------------|
| **Bar** | Comparing categories | Categories + Values |
| **Line** | Trends over time | Time series |
| **Area** | Volume over time | Time series (stacked) |
| **Pie/Donut** | Part of whole | Categories + Percentages |
| **Scatter** | Correlation | Two numeric variables |
| **Heatmap** | Density/patterns | Matrix data |
| **Treemap** | Hierarchical parts | Nested categories |
| **Funnel** | Sequential stages | Ordered stages |
| **Radar** | Multi-variable comparison | Multiple metrics |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Interface                        │
├─────────────────────────────────────────────────────────────┤
│  User: "Visualize this sales data as a bar chart"           │
│  [Attaches CSV or pastes data]                              │
│                                                              │
│  AI calls: data-visualizer({                                │
│    data: [...],                                             │
│    chartType: "bar",                                        │
│    xAxis: "month",                                          │
│    yAxis: "revenue"                                         │
│  })                                                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Sales Revenue by Month          [Bar ▼] [Export ▼] │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │     ████                                    │    │    │
│  │  │     ████  ████                              │    │    │
│  │  │     ████  ████  ████                        │    │    │
│  │  │ ████████  ████  ████  ████                  │    │    │
│  │  │ ████████  ████  ████  ████  ████           │    │    │
│  │  │──────────────────────────────────────       │    │    │
│  │  │ Jan  Feb  Mar  Apr  May  Jun                │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │  [📊 Table] [🎨 Colors] [📏 Axes]                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  User: "Switch to a line chart and add last year's data"   │
│  UI calls: viz-change-type({ chartType: "line" })          │
│  UI calls: viz-add-series({ field: "revenue_2025" })       │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Considerations

### Charting Library
- **Recommended**: ECharts, Chart.js, or Recharts
- Requirements: Responsive, interactive, exportable
- Consider: Bundle size, SSR compatibility

### Data Processing
- Auto-detect data types (number, date, string)
- Handle missing values gracefully
- Smart axis scaling
- Automatic aggregation suggestions

### Performance
- Canvas rendering for large datasets (>10k points)
- Data sampling for scatter plots
- Lazy render off-screen elements
- Debounce rapid updates

### Accessibility
- Alt text generation for charts
- Keyboard-navigable data points
- High contrast color options
- Data table as accessible alternative

---

## Example Prompts

- "Create a pie chart of expenses by category"
- "Plot this time series data as a line chart"
- "Show me a scatter plot of price vs. quantity"
- "Visualize the top 10 products by sales"
- "Compare this year vs last year revenue by month"
- "Create a heatmap of website traffic by day and hour"

---

## Future Enhancements

- [ ] Real-time data streaming
- [ ] Dashboard mode (multiple charts)
- [ ] Annotations and comments
- [ ] Trendlines and forecasting
- [ ] Geographic maps (choropleth)
- [ ] Drill-down hierarchies
- [ ] Chart templates/presets
- [ ] Collaborative annotations
- [ ] Natural language queries ("What's the peak month?")
