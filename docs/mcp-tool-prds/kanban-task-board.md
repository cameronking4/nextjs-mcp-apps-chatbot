# Kanban Task Board - MCP Tool PRD

## Overview

An interactive Kanban board for visual task management directly within the chat interface. Users can create, organize, and track tasks across customizable columns without leaving the conversation.

## Value Proposition

- **Immediate productivity**: Manage tasks without switching to external apps
- **Conversational context**: AI can help prioritize, suggest tasks, and update the board
- **Persistent state**: Board state can be saved and resumed across sessions

---

## Tool Definition

### Primary Tool: `kanban-board`

**Description**: Display an interactive Kanban task board for visual task management.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "boardId": {
      "type": "string",
      "description": "Unique board identifier (creates new if not provided)"
    },
    "title": {
      "type": "string",
      "description": "Board title",
      "default": "My Tasks"
    },
    "columns": {
      "type": "array",
      "description": "Initial columns configuration",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "color": { "type": "string" }
        }
      },
      "default": [
        { "id": "todo", "title": "To Do", "color": "#6b7280" },
        { "id": "in-progress", "title": "In Progress", "color": "#3b82f6" },
        { "id": "done", "title": "Done", "color": "#22c55e" }
      ]
    },
    "tasks": {
      "type": "array",
      "description": "Initial tasks to populate",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "columnId": { "type": "string" },
          "priority": { "type": "string", "enum": ["low", "medium", "high"] },
          "dueDate": { "type": "string", "format": "date" },
          "tags": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

### App-Only Tools (called from UI):

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `kanban-add-task` | Add a new task to a column | `{ columnId, title, description?, priority?, dueDate?, tags? }` |
| `kanban-move-task` | Move task to different column | `{ taskId, targetColumnId, position? }` |
| `kanban-update-task` | Update task properties | `{ taskId, updates: {...} }` |
| `kanban-delete-task` | Remove a task | `{ taskId }` |
| `kanban-add-column` | Add a new column | `{ title, color?, position? }` |
| `kanban-save-board` | Persist board state | `{ boardId }` |

---

## UI Features

### Layout
- **Header**: Board title, filter/search, add column button
- **Columns**: Horizontal scrollable columns with task cards
- **Footer**: Task count summary, save indicator

### Task Card
- Title (editable inline)
- Description preview (expandable)
- Priority indicator (color-coded dot)
- Due date badge (with overdue highlighting)
- Tags as colored chips
- Quick actions menu (edit, delete, duplicate)

### Interactions
- **Drag & Drop**: Move tasks between columns and reorder within columns
- **Quick Add**: Click "+" on column header to add task
- **Inline Edit**: Double-click to edit task title
- **Modal Edit**: Click task for full edit modal with all fields
- **Column Management**: Add, rename, reorder, delete columns
- **Filters**: By priority, due date, tags, or search text

### Visual Feedback
- Drag ghost with drop zone highlighting
- Animation on task creation/movement
- Overdue tasks highlighted in red
- Progress indicators per column

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Interface                        │
├─────────────────────────────────────────────────────────────┤
│  User: "Create a kanban board for my project"               │
│                                                              │
│  AI calls: kanban-board({ title: "Project Tasks" })         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │  To Do   │  │In Progress│  │   Done   │          │    │
│  │  ├──────────┤  ├──────────┤  ├──────────┤          │    │
│  │  │ [Task 1] │  │ [Task 3] │  │ [Task 5] │          │    │
│  │  │ [Task 2] │  │ [Task 4] │  │          │          │    │
│  │  │   [+]    │  │   [+]    │  │   [+]    │  [+Col]  │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  │                                                     │    │
│  │  User drags Task 2 → In Progress                   │    │
│  │  UI calls: kanban-move-task({ taskId, columnId })  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Considerations

### State Management
- Local state in iframe for responsiveness
- Sync to server on meaningful actions (add, move, delete)
- Debounced saves for bulk operations
- Optimistic updates with rollback on failure

### Persistence Options
1. **Session-only**: State lives only during conversation
2. **LocalStorage**: Persist client-side between sessions
3. **Server-side**: Save to database via tool calls

### Accessibility
- Keyboard navigation (arrow keys, Enter, Escape)
- Screen reader announcements for drag operations
- Focus management on modal open/close
- High contrast mode support

### Performance
- Virtualized rendering for boards with many tasks
- Lazy load task details
- Batch updates for bulk operations

---

## Example Prompts

- "Create a kanban board for my sprint planning"
- "Add these tasks to my board: design mockups, implement API, write tests"
- "Show me my project board and move all high-priority items to In Progress"
- "Create a board with columns: Backlog, This Week, Today, Done"

---

## Future Enhancements

- [ ] Swimlanes (horizontal grouping)
- [ ] Task dependencies/blockers
- [ ] Time tracking per task
- [ ] Multiple assignees with avatars
- [ ] Board templates (Sprint, Personal, etc.)
- [ ] Export to CSV/JSON
- [ ] Integration with external tools (Jira, Trello import)
