# Markdown/Rich Text Editor - MCP Tool PRD

## Overview

A WYSIWYG rich text editor with live Markdown preview for creating and editing documents, notes, and content directly within the chat. Supports formatting, media embedding, and export to multiple formats.

## Value Proposition

- **In-context editing**: Write and format content without switching apps
- **AI-assisted writing**: "Make this more concise" with instant apply
- **Format flexibility**: Write in Markdown or rich text, export as needed
- **Collaborative potential**: Share and co-edit with AI assistance

---

## Tool Definition

### Primary Tool: `rich-text-editor`

**Description**: Open an interactive rich text/Markdown editor for content creation.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "Initial content (Markdown or HTML)"
    },
    "mode": {
      "type": "string",
      "enum": ["wysiwyg", "markdown", "split"],
      "default": "wysiwyg",
      "description": "Editor mode"
    },
    "title": {
      "type": "string",
      "description": "Document title"
    },
    "placeholder": {
      "type": "string",
      "default": "Start writing...",
      "description": "Placeholder text when empty"
    },
    "options": {
      "type": "object",
      "properties": {
        "spellcheck": { "type": "boolean", "default": true },
        "wordCount": { "type": "boolean", "default": true },
        "autoSave": { "type": "boolean", "default": true },
        "maxLength": { "type": "number" },
        "allowImages": { "type": "boolean", "default": true },
        "allowTables": { "type": "boolean", "default": true },
        "allowCodeBlocks": { "type": "boolean", "default": true }
      }
    },
    "template": {
      "type": "string",
      "enum": ["blank", "blog-post", "meeting-notes", "readme", "email"],
      "description": "Start from a template"
    }
  }
}
```

### App-Only Tools (called from UI):

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `editor-get-content` | Get current content | `{ format: "markdown" \| "html" \| "text" }` |
| `editor-set-content` | Replace content | `{ content, format }` |
| `editor-insert` | Insert at cursor | `{ content, format? }` |
| `editor-format` | Apply formatting | `{ format: "bold" \| "italic" \| "heading" \| ... }` |
| `editor-export` | Export document | `{ format: "md" \| "html" \| "pdf" \| "docx" }` |
| `editor-save` | Save document | `{ documentId?, title? }` |
| `editor-ai-assist` | Request AI edit | `{ instruction, selection? }` |

---

## UI Features

### Editor Modes

#### WYSIWYG Mode
- Click and type like a word processor
- Formatting toolbar visible
- Inline formatting previews
- Drag-drop images

#### Markdown Mode
- Syntax-highlighted Markdown input
- Line numbers
- Vim/Emacs keybindings (optional)
- Markdown shortcuts (**, ##, etc.)

#### Split Mode
- Side-by-side Markdown + Preview
- Synced scrolling
- Click preview to jump to source

### Formatting Toolbar

```
┌────────────────────────────────────────────────────────────┐
│ B  I  U  S  │ H1 H2 H3 │ • ○ 1. │ "" </> │ 🔗 📷 📊 │ ⋮ │
└────────────────────────────────────────────────────────────┘
  Bold, Italic  Headings   Lists   Quote   Links  More
  Underline                         Code   Images
  Strike                                   Tables
```

### Features

#### Text Formatting
- Bold, Italic, Underline, Strikethrough
- Headings (H1-H6)
- Ordered and unordered lists
- Checklists / task lists
- Blockquotes
- Code (inline and blocks with syntax highlighting)
- Horizontal rules

#### Media & Embeds
- Images (paste, drag-drop, URL)
- Tables (visual editor)
- Code blocks (language selector)
- Math equations (LaTeX)
- Embeds (YouTube, tweets, etc.)

#### Utilities
- Find & replace
- Word/character count
- Reading time estimate
- Table of contents generation
- Link checker

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+K` | Insert link |
| `Ctrl+Shift+C` | Code block |
| `Ctrl+1-6` | Heading levels |
| `Ctrl+S` | Save |
| `Ctrl+Z/Y` | Undo/Redo |
| `Tab` | Indent list |
| `Shift+Tab` | Outdent list |

### AI Assistance Panel
- "Improve writing" button
- Selection-based actions:
  - Make concise
  - Expand
  - Change tone
  - Fix grammar
  - Translate
- Full document actions:
  - Generate summary
  - Add conclusion
  - Create outline

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Interface                        │
├─────────────────────────────────────────────────────────────┤
│  User: "Help me write a blog post about MCP Apps"           │
│                                                              │
│  AI calls: rich-text-editor({                               │
│    mode: "wysiwyg",                                         │
│    template: "blog-post",                                   │
│    content: "# MCP Apps: The Future of AI Interfaces\n..."  │
│  })                                                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📝 Blog Post                    [WYSIWYG][MD][Split]│    │
│  │  ───────────────────────────────────────────────────│    │
│  │  [B][I][U] [H1▼] [•][1.] ["][</>] [🔗][📷] [AI ✨]  │    │
│  │  ═══════════════════════════════════════════════════│    │
│  │                                                     │    │
│  │  # MCP Apps: The Future of AI Interfaces           │    │
│  │                                                     │    │
│  │  MCP Apps represent a paradigm shift in how we     │    │
│  │  interact with AI assistants. Instead of plain     │    │
│  │  text responses, users get **rich, interactive**   │    │
│  │  experiences directly in the chat.                 │    │
│  │                                                     │    │
│  │  ## Key Benefits                                   │    │
│  │  - [x] Visual feedback                            │    │
│  │  - [ ] Interactive controls                        │    │
│  │  - [ ] Real-time updates                          │    │
│  │                                                     │    │
│  │  |                                                 │    │
│  │  ───────────────────────────────────────────────────│    │
│  │  Words: 127 │ Reading: 1 min │ Auto-saved ✓       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  User: "Make the intro more engaging"                       │
│  AI calls: editor-ai-assist({                              │
│    instruction: "Make more engaging",                       │
│    selection: { start: 0, end: 150 }                       │
│  })                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Considerations

### Editor Framework
- **Recommended**: Tiptap (ProseMirror), Slate, or Lexical
- Requirements: Extensible, Markdown support, collaborative-ready

### Content Format
- Store as Markdown (portable)
- Render as rich text (WYSIWYG)
- Convert on export (HTML, PDF, DOCX)

### Auto-Save
- Debounced saves (2s after last change)
- IndexedDB for offline storage
- Conflict resolution for concurrent edits

### Performance
- Virtualize long documents
- Lazy load images
- Efficient diff for large content

### Accessibility
- Semantic HTML output
- Keyboard-only operation
- Screen reader compatible
- Focus management

---

## Example Prompts

- "Open an editor so I can write meeting notes"
- "Help me draft an email to the team"
- "Create a README template for my project"
- "Edit this document and make it more professional"
- "Convert this text to a formatted blog post"
- "Proofread and fix the grammar in my essay"

---

## Templates

### Blog Post
```markdown
# [Title]

*Published on [Date] by [Author]*

## Introduction
[Hook your readers...]

## Main Content
### Section 1
...

## Conclusion
[Call to action...]

---
*Tags: [tag1], [tag2]*
```

### Meeting Notes
```markdown
# Meeting: [Title]
**Date:** [Date] | **Attendees:** [Names]

## Agenda
- [ ] Item 1
- [ ] Item 2

## Discussion
### Topic 1
...

## Action Items
- [ ] @person: Task (Due: Date)

## Next Meeting
[Date/Time]
```

---

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Comments and suggestions mode
- [ ] Version history
- [ ] Custom templates
- [ ] Voice dictation
- [ ] Grammarly-style suggestions
- [ ] Citation management
- [ ] Publishing integrations (Medium, Dev.to, etc.)
