# Calendar Scheduler - MCP Tool PRD

## Overview

An interactive calendar for viewing schedules, booking meetings, and managing events directly within the chat interface. Supports multiple views (day, week, month) and timezone handling.

## Value Proposition

- **Seamless scheduling**: Book meetings without switching to calendar apps
- **AI-assisted**: "Find me a free slot next week" powered by calendar visibility
- **Timezone aware**: Handle global team scheduling with automatic conversion
- **Quick actions**: Create events from natural language in chat

---

## Tool Definition

### Primary Tool: `calendar-view`

**Description**: Display an interactive calendar with events and scheduling capabilities.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "view": {
      "type": "string",
      "enum": ["day", "week", "month", "agenda"],
      "default": "week",
      "description": "Initial calendar view"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Focus date (defaults to today)"
    },
    "timezone": {
      "type": "string",
      "description": "Display timezone (e.g., 'America/New_York')",
      "default": "local"
    },
    "events": {
      "type": "array",
      "description": "Events to display",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "start": { "type": "string", "format": "date-time" },
          "end": { "type": "string", "format": "date-time" },
          "allDay": { "type": "boolean" },
          "color": { "type": "string" },
          "location": { "type": "string" },
          "description": { "type": "string" },
          "attendees": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["id", "title", "start"]
      }
    },
    "workingHours": {
      "type": "object",
      "properties": {
        "start": { "type": "string", "default": "09:00" },
        "end": { "type": "string", "default": "17:00" },
        "days": { "type": "array", "items": { "type": "number" }, "default": [1,2,3,4,5] }
      }
    },
    "readOnly": {
      "type": "boolean",
      "default": false,
      "description": "Disable event creation/editing"
    }
  }
}
```

### App-Only Tools (called from UI):

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `calendar-create-event` | Create a new event | `{ title, start, end, allDay?, location?, description?, attendees? }` |
| `calendar-update-event` | Update event details | `{ eventId, updates: {...} }` |
| `calendar-delete-event` | Remove an event | `{ eventId }` |
| `calendar-move-event` | Reschedule event (drag) | `{ eventId, newStart, newEnd }` |
| `calendar-find-slots` | Find available time slots | `{ duration, dateRange, attendees? }` |
| `calendar-export` | Export events | `{ format: "ics" \| "json", dateRange? }` |

---

## UI Features

### Views

#### Day View
- Hourly grid (scrollable)
- Events as blocks with duration
- Current time indicator (red line)
- All-day events at top

#### Week View
- 7-day columns
- Compact event display
- Drag to create events
- Resize events vertically

#### Month View
- Traditional calendar grid
- Event dots/chips per day
- Click day to expand
- Multi-day events span cells

#### Agenda View
- Chronological event list
- Grouped by day
- Expandable event details
- Quick actions inline

### Event Creation
- **Click & Drag**: Select time range to create event
- **Quick Add**: Click empty slot → popup with title field
- **Full Modal**: Complete event form with all fields

### Event Display
- Color-coded by calendar/category
- Title + time visible
- Hover for preview tooltip
- Click for full details modal

### Navigation
- Today button (jump to current date)
- Prev/Next arrows
- Date picker dropdown
- Keyboard shortcuts (T=today, ←→=navigate)

### Timezone Handling
- Timezone selector dropdown
- Events display in selected timezone
- Original timezone shown in tooltip
- "Your time" vs "Event time" labels

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Interface                        │
├─────────────────────────────────────────────────────────────┤
│  User: "Show my calendar for next week"                     │
│                                                              │
│  AI calls: calendar-view({ view: "week", date: "2026-02-02" })
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  < Jan 27 - Feb 2, 2026 >        [Day][Week][Month] │    │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐       │    │
│  │  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │       │    │
│  │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤       │    │
│  │  │9am  │     │█████│     │     │     │     │       │    │
│  │  │     │█████│█████│     │     │     │     │       │    │
│  │  │     │█████│     │█████│     │     │     │       │    │
│  │  │     │     │     │█████│     │     │     │       │    │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘       │    │
│  │                                                     │    │
│  │  User drags to create event Wed 2-3pm              │    │
│  │  UI calls: calendar-create-event({ ... })          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  User: "Find me a 30-min slot with Alice this week"        │
│  AI calls: calendar-find-slots({ duration: 30, ... })      │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Considerations

### Date/Time Handling
- Use ISO 8601 for all date/time storage
- Luxon or date-fns for timezone operations
- Handle DST transitions correctly
- Support recurring events (iCal RRULE)

### Performance
- Lazy load events outside viewport
- Virtual scrolling for day view hours
- Batch event updates
- Debounce drag operations

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation (Tab, Enter, arrows)
- Screen reader announcements for time changes
- Focus trap in modals

### Mobile Considerations
- Touch-friendly event creation
- Swipe to change dates
- Responsive column widths
- Bottom sheet for event details

---

## Example Prompts

- "Show my calendar for this week"
- "Schedule a meeting with the team next Tuesday at 2pm"
- "Find a free 1-hour slot tomorrow afternoon"
- "Block off Friday as a focus day"
- "What meetings do I have today?"
- "Move my 3pm call to Thursday"

---

## Future Enhancements

- [ ] Calendar sync (Google, Outlook, Apple)
- [ ] Recurring events UI
- [ ] Availability sharing (booking links)
- [ ] Room/resource booking
- [ ] Video conferencing integration
- [ ] Smart scheduling suggestions
- [ ] Buffer time between meetings
- [ ] Working location (office/remote) tracking
