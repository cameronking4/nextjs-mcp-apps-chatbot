# API Tester (Mini-Postman) - MCP Tool PRD

## Overview

A lightweight HTTP client for testing APIs directly within the chat interface. Send requests, inspect responses, manage headers/auth, and save request collections—all without leaving the conversation.

## Value Proposition

- **Developer workflow**: Test APIs while discussing implementation
- **AI-assisted debugging**: "Why is this returning 401?" with full context
- **Quick iteration**: Modify and resend requests instantly
- **Documentation**: Export request/response as curl or code snippets

---

## Tool Definition

### Primary Tool: `api-tester`

**Description**: Open an interactive API testing interface to send HTTP requests.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "method": {
      "type": "string",
      "enum": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      "default": "GET"
    },
    "url": {
      "type": "string",
      "description": "Request URL"
    },
    "headers": {
      "type": "object",
      "description": "Request headers",
      "additionalProperties": { "type": "string" }
    },
    "body": {
      "oneOf": [
        { "type": "string" },
        { "type": "object" }
      ],
      "description": "Request body (for POST, PUT, PATCH)"
    },
    "bodyType": {
      "type": "string",
      "enum": ["json", "form", "text", "xml", "graphql"],
      "default": "json"
    },
    "auth": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["none", "basic", "bearer", "api-key"]
        },
        "credentials": { "type": "object" }
      }
    },
    "autoSend": {
      "type": "boolean",
      "default": false,
      "description": "Send request immediately on load"
    },
    "collection": {
      "type": "string",
      "description": "Load from saved collection"
    }
  }
}
```

### App-Only Tools (called from UI):

| Tool Name | Description | Input |
|-----------|-------------|-------|
| `api-send-request` | Send the configured request | `{ method, url, headers, body, auth }` |
| `api-save-request` | Save to collection | `{ name, folder?, request }` |
| `api-load-collection` | Load saved collection | `{ collectionId }` |
| `api-export` | Export request | `{ format: "curl" \| "fetch" \| "axios" \| "python" }` |
| `api-set-variable` | Set environment variable | `{ key, value }` |
| `api-import-curl` | Import from curl command | `{ curlCommand }` |

---

## UI Features

### Request Builder

#### URL Bar
```
┌─────────────────────────────────────────────────────────────┐
│ [GET ▼] │ https://api.example.com/users/{{userId}}  │ [Send]│
└─────────────────────────────────────────────────────────────┘
```

- Method dropdown (color-coded: GET=green, POST=yellow, DELETE=red)
- URL input with variable highlighting `{{var}}`
- Send button with loading state
- History dropdown

#### Tabs Panel
```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Params  │  Headers │   Body   │   Auth   │  Pre-req │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Params Tab**
- Key-value table for query parameters
- Bulk edit mode
- Enable/disable toggle per param

**Headers Tab**
- Key-value table
- Common headers autocomplete
- Presets (JSON, Form, XML)

**Body Tab**
- Format selector: JSON, Form Data, Raw, Binary, GraphQL
- Syntax-highlighted editor
- JSON validation
- Pretty print / minify
- GraphQL: Query + Variables panes

**Auth Tab**
- Type selector: None, Basic, Bearer, API Key, OAuth 2.0
- Credential inputs based on type
- "Inherit from collection" option

**Pre-request Tab** (Advanced)
- JavaScript sandbox for dynamic values
- Set variables, compute signatures
- Example: Generate timestamp, HMAC

### Response Viewer

#### Status Bar
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ 200 OK │ 234ms │ 1.2 KB │ application/json              │
└─────────────────────────────────────────────────────────────┘
```

- Status code (color-coded: 2xx=green, 4xx=orange, 5xx=red)
- Response time
- Response size
- Content-Type

#### Response Tabs
```
┌──────────┬──────────┬──────────┬──────────┐
│   Body   │  Headers │  Cookies │   Raw    │
└──────────┴──────────┴──────────┴──────────┘
```

**Body Tab**
- Pretty-printed JSON/XML
- Syntax highlighting
- Collapsible tree view
- Search/filter
- Copy path (click to copy JSONPath)

**Headers Tab**
- Response headers table
- Click to copy

**Cookies Tab**
- Parsed cookies with attributes
- Domain, Path, Expires, HttpOnly, Secure

### Collections Sidebar

```
┌─────────────────┐
│ 📁 Collections  │
├─────────────────┤
│ ▼ My API       │
│   ├ GET users  │
│   ├ POST user  │
│   └ 📁 Admin   │
│     └ DELETE   │
├─────────────────┤
│ 🌍 Environment │
│   [Production▼]│
│   baseUrl: ... │
│   apiKey: ...  │
└─────────────────┘
```

- Folder organization
- Drag to reorder
- Environment selector
- Variable management

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Interface                        │
├─────────────────────────────────────────────────────────────┤
│  User: "Test this API endpoint: POST /api/users"            │
│                                                              │
│  AI calls: api-tester({                                     │
│    method: "POST",                                          │
│    url: "https://api.example.com/users",                    │
│    headers: { "Content-Type": "application/json" },         │
│    body: { "name": "John", "email": "john@example.com" }    │
│  })                                                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [POST ▼] https://api.example.com/users      [Send]  │    │
│  │ ─────────────────────────────────────────────────── │    │
│  │ [Params] [Headers] [Body*] [Auth]                   │    │
│  │ ┌─────────────────────────────────────────────────┐ │    │
│  │ │ {                                               │ │    │
│  │ │   "name": "John",                               │ │    │
│  │ │   "email": "john@example.com"                   │ │    │
│  │ │ }                                               │ │    │
│  │ └─────────────────────────────────────────────────┘ │    │
│  │ ═══════════════════════════════════════════════════ │    │
│  │ ✓ 201 Created │ 89ms │ 156 B                       │    │
│  │ [Body*] [Headers] [Cookies]                         │    │
│  │ ┌─────────────────────────────────────────────────┐ │    │
│  │ │ {                                               │ │    │
│  │ │   "id": "usr_abc123",                           │ │    │
│  │ │   "name": "John",                               │ │    │
│  │ │   "email": "john@example.com",                  │ │    │
│  │ │   "createdAt": "2026-01-29T..."                 │ │    │
│  │ │ }                                               │ │    │
│  │ └─────────────────────────────────────────────────┘ │    │
│  │ [📋 Copy] [💾 Save] [📤 Export ▼]                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  User: "Now try with an invalid email"                      │
│  AI modifies body and resends...                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Considerations

### Request Execution
- Use server-side proxy to avoid CORS issues
- Support for self-signed certs (dev mode)
- Request timeout configuration
- Follow redirects option

### Security
- Never store sensitive credentials in plaintext
- Environment variables for secrets
- Warn before sending to non-HTTPS
- Sanitize displayed tokens/keys

### Performance
- Stream large responses
- Truncate massive payloads with "Load more"
- Cancel in-flight requests

### Code Export Formats

**cURL**
```bash
curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -d '{"name":"John","email":"john@example.com"}'
```

**JavaScript (fetch)**
```javascript
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});
```

**Python (requests)**
```python
import requests
response = requests.post(
    'https://api.example.com/users',
    json={'name': 'John', 'email': 'john@example.com'}
)
```

---

## Example Prompts

- "Test the GET /users endpoint"
- "Send a POST request to create a new product"
- "Why is this API returning 403?"
- "Add authorization header and retry"
- "Show me how to call this in Python"
- "Import this curl command and run it"
- "Save this request to my collection"

---

## Future Enhancements

- [ ] WebSocket testing
- [ ] GraphQL explorer with schema introspection
- [ ] Request chaining (use response in next request)
- [ ] Automated testing/assertions
- [ ] Mock server generation
- [ ] OpenAPI/Swagger import
- [ ] Response diff (compare two responses)
- [ ] Load testing (basic)
- [ ] Request history with search
- [ ] Team collections sharing
