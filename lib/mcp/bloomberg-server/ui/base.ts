/**
 * Bloomberg Terminal UI Base Styles
 * 
 * Provides CSS variables and base styles for Bloomberg Terminal-like UIs.
 * Optimized for compact, data-dense displays with terminal aesthetics.
 * Supports both light and dark modes through CSS variables.
 */

export function getBaseStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      /* Light mode - Terminal inspired */
      --bg-primary: hsl(0 0% 100%);
      --bg-secondary: hsl(220 14% 96%);
      --bg-tertiary: hsl(220 13% 91%);
      --text-primary: hsl(220 9% 12%);
      --text-secondary: hsl(220 9% 40%);
      --text-muted: hsl(220 9% 55%);
      --border: hsl(220 13% 87%);
      --border-subtle: hsl(220 13% 91%);
      
      /* Accent colors */
      --accent-green: hsl(142 76% 36%);
      --accent-green-bg: hsl(142 76% 94%);
      --accent-red: hsl(0 84% 50%);
      --accent-red-bg: hsl(0 84% 96%);
      --accent-blue: hsl(221 83% 53%);
      --accent-blue-bg: hsl(221 83% 96%);
      --accent-yellow: hsl(45 93% 47%);
      --accent-yellow-bg: hsl(45 93% 94%);
      --accent-orange: hsl(25 95% 53%);
      
      /* Interactive */
      --btn-primary-bg: hsl(220 9% 12%);
      --btn-primary-text: hsl(0 0% 100%);
      --btn-secondary-bg: hsl(220 14% 96%);
      --btn-secondary-text: hsl(220 9% 12%);
      --input-bg: hsl(0 0% 100%);
      --input-border: hsl(220 13% 87%);
      --focus-ring: hsl(221 83% 53%);
      
      /* Typography */
      --font-mono: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      
      /* Spacing */
      --space-xs: 4px;
      --space-sm: 8px;
      --space-md: 12px;
      --space-lg: 16px;
      --space-xl: 24px;
      
      /* Borders */
      --radius-sm: 4px;
      --radius-md: 6px;
      --radius-lg: 8px;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: hsl(220 13% 10%);
        --bg-secondary: hsl(220 13% 14%);
        --bg-tertiary: hsl(220 13% 18%);
        --text-primary: hsl(0 0% 95%);
        --text-secondary: hsl(220 9% 70%);
        --text-muted: hsl(220 9% 55%);
        --border: hsl(220 13% 22%);
        --border-subtle: hsl(220 13% 18%);
        
        --accent-green: hsl(142 71% 45%);
        --accent-green-bg: hsl(142 71% 12%);
        --accent-red: hsl(0 72% 55%);
        --accent-red-bg: hsl(0 72% 12%);
        --accent-blue: hsl(217 91% 60%);
        --accent-blue-bg: hsl(217 91% 15%);
        --accent-yellow: hsl(48 96% 53%);
        --accent-yellow-bg: hsl(48 96% 12%);
        
        --btn-primary-bg: hsl(0 0% 95%);
        --btn-primary-text: hsl(220 13% 10%);
        --btn-secondary-bg: hsl(220 13% 18%);
        --btn-secondary-text: hsl(0 0% 95%);
        --input-bg: hsl(220 13% 14%);
        --input-border: hsl(220 13% 22%);
      }
    }

    body {
      font-family: var(--font-sans);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 13px;
      line-height: 1.4;
    }

    body.dark {
      --bg-primary: hsl(220 13% 10%);
      --bg-secondary: hsl(220 13% 14%);
      --bg-tertiary: hsl(220 13% 18%);
      --text-primary: hsl(0 0% 95%);
      --text-secondary: hsl(220 9% 70%);
      --text-muted: hsl(220 9% 55%);
      --border: hsl(220 13% 22%);
      --border-subtle: hsl(220 13% 18%);
      --accent-green: hsl(142 71% 45%);
      --accent-green-bg: hsl(142 71% 12%);
      --accent-red: hsl(0 72% 55%);
      --accent-red-bg: hsl(0 72% 12%);
      --accent-blue: hsl(217 91% 60%);
      --accent-blue-bg: hsl(217 91% 15%);
      --accent-yellow: hsl(48 96% 53%);
      --accent-yellow-bg: hsl(48 96% 12%);
      --btn-primary-bg: hsl(0 0% 95%);
      --btn-primary-text: hsl(220 13% 10%);
      --btn-secondary-bg: hsl(220 13% 18%);
      --btn-secondary-text: hsl(0 0% 95%);
      --input-bg: hsl(220 13% 14%);
      --input-border: hsl(220 13% 22%);
    }

    /* Card container */
    .card {
      background: var(--bg-primary);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .card-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .card-content {
      padding: var(--space-md);
    }

    .card-footer {
      padding: var(--space-sm) var(--space-md);
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    /* Typography */
    .text-lg { font-size: 18px; font-weight: 600; }
    .text-md { font-size: 14px; font-weight: 500; }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 11px; }
    .text-mono { font-family: var(--font-mono); }
    .text-muted { color: var(--text-muted); }
    .text-secondary { color: var(--text-secondary); }

    /* Price colors */
    .positive { color: var(--accent-green); }
    .negative { color: var(--accent-red); }
    .neutral { color: var(--text-secondary); }

    .positive-bg { background: var(--accent-green-bg); color: var(--accent-green); }
    .negative-bg { background: var(--accent-red-bg); color: var(--accent-red); }

    /* Data table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table th {
      text-align: left;
      padding: var(--space-xs) var(--space-sm);
      font-weight: 500;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .data-table td {
      padding: var(--space-xs) var(--space-sm);
      border-bottom: 1px solid var(--border-subtle);
      font-family: var(--font-mono);
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tr:hover {
      background: var(--bg-secondary);
    }

    .data-table .text-right {
      text-align: right;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-sm);
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border-color: var(--btn-primary-bg);
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .btn-secondary {
      background: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      border-color: var(--border);
    }

    .btn-secondary:hover {
      background: var(--bg-tertiary);
    }

    .btn-sm {
      padding: 2px 6px;
      font-size: 11px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Inputs */
    .input {
      width: 100%;
      padding: var(--space-xs) var(--space-sm);
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: var(--radius-sm);
      font-size: 12px;
      color: var(--text-primary);
      font-family: inherit;
    }

    .input:focus {
      outline: none;
      border-color: var(--focus-ring);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .input::placeholder {
      color: var(--text-muted);
    }

    /* Grid layouts */
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-sm); }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-sm); }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-sm); }

    /* Flex utilities */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-between { justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .gap-xs { gap: var(--space-xs); }
    .gap-sm { gap: var(--space-sm); }
    .gap-md { gap: var(--space-md); }

    /* Spacing utilities */
    .p-xs { padding: var(--space-xs); }
    .p-sm { padding: var(--space-sm); }
    .p-md { padding: var(--space-md); }
    .mt-xs { margin-top: var(--space-xs); }
    .mt-sm { margin-top: var(--space-sm); }
    .mt-md { margin-top: var(--space-md); }
    .mb-xs { margin-bottom: var(--space-xs); }
    .mb-sm { margin-bottom: var(--space-sm); }
    .mb-md { margin-bottom: var(--space-md); }

    /* Badges/Tags */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .badge-green { background: var(--accent-green-bg); color: var(--accent-green); }
    .badge-red { background: var(--accent-red-bg); color: var(--accent-red); }
    .badge-blue { background: var(--accent-blue-bg); color: var(--accent-blue); }
    .badge-yellow { background: var(--accent-yellow-bg); color: var(--accent-yellow); }

    /* Metric card */
    .metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .metric-value {
      font-size: 14px;
      font-weight: 600;
      font-family: var(--font-mono);
    }

    /* Divider */
    .divider {
      height: 1px;
      background: var(--border);
      margin: var(--space-sm) 0;
    }

    /* Loading state */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
      color: var(--text-muted);
    }

    /* Sparkline container */
    .sparkline {
      display: flex;
      align-items: flex-end;
      gap: 1px;
      height: 24px;
    }

    .sparkline-bar {
      flex: 1;
      background: var(--accent-blue);
      border-radius: 1px;
      min-height: 2px;
    }

    /* Tab navigation */
    .tabs {
      display: flex;
      gap: var(--space-xs);
      border-bottom: 1px solid var(--border);
      padding: 0 var(--space-md);
    }

    .tab {
      padding: var(--space-sm) var(--space-md);
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.15s ease;
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab.active {
      color: var(--text-primary);
      border-bottom-color: var(--accent-blue);
    }

    /* News item */
    .news-item {
      padding: var(--space-sm);
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .news-item:hover {
      background: var(--bg-secondary);
    }

    .news-item:last-child {
      border-bottom: none;
    }

    .news-headline {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.3;
      margin-bottom: 4px;
    }

    .news-meta {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Scrollable container */
    .scroll-container {
      max-height: 300px;
      overflow-y: auto;
    }

    .scroll-container::-webkit-scrollbar {
      width: 6px;
    }

    .scroll-container::-webkit-scrollbar-track {
      background: var(--bg-secondary);
    }

    .scroll-container::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }

    .scroll-container::-webkit-scrollbar-thumb:hover {
      background: var(--text-muted);
    }
  `;
}

/**
 * Get base HTML head content
 */
export function getBaseHead(title: string): string {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${getBaseStyles()}</style>
  `;
}

/**
 * Get base scripts for MCP App communication
 * NOTE: This returns raw JavaScript code - wrap in <script> tags when using
 */
export function getBaseScripts(): string {
  return `
    // Utility functions
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function formatNumber(num, decimals = 2) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(num);
    }

    function formatCurrency(num, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    }

    function formatLargeNumber(num) {
      if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
      if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
      if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
      return num.toFixed(2);
    }

    function formatPercent(num) {
      const sign = num >= 0 ? '+' : '';
      return sign + num.toFixed(2) + '%';
    }

    function formatVolume(num) {
      return new Intl.NumberFormat('en-US').format(num);
    }

    function getChangeClass(change) {
      if (change > 0) return 'positive';
      if (change < 0) return 'negative';
      return 'neutral';
    }

    function timeAgo(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
      if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
      return Math.floor(seconds / 86400) + 'd ago';
    }

    // Report height changes to parent
    function reportHeight() {
      const height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'mcp:sizeChange', payload: { height } }, '*');
    }

    // Call a tool from the UI
    function callTool(toolName, args) {
      return new Promise((resolve, reject) => {
        const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const handler = (event) => {
          if (event.data?.type === 'mcp:toolCallResult' && event.data?.payload?.callId === callId) {
            window.removeEventListener('message', handler);
            if (event.data.payload.error) {
              reject(new Error(event.data.payload.error));
            } else {
              resolve(event.data.payload.result);
            }
          }
        };
        
        window.addEventListener('message', handler);
        
        window.parent.postMessage({
          type: 'mcp:callTool',
          payload: { callId, name: toolName, arguments: args }
        }, '*');
        
        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Tool call timeout'));
        }, 30000);
      });
    }

    // Send a message back to the chat
    function sendMessage(text) {
      window.parent.postMessage({
        type: 'mcp:sendMessage',
        payload: { text }
      }, '*');
    }

    // Initialize theme
    function initTheme(theme) {
      document.body.className = theme === 'dark' ? 'dark' : '';
    }

    // Listen for messages from parent
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:hostContext' && payload?.theme) {
        initTheme(payload.theme);
      }
    });

    // Signal ready
    window.parent.postMessage({ type: 'mcp:ready' }, '*');
    requestAnimationFrame(reportHeight);
  `;
}
