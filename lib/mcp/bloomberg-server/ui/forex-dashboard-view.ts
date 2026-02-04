/**
 * Forex Dashboard View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getForexDashboardViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Forex Dashboard")}
  <style>
    .forex-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .forex-title {
      font-size: 16px;
      font-weight: 700;
    }

    .forex-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--space-sm);
      padding: var(--space-md);
    }

    .forex-card {
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      padding: var(--space-sm);
    }

    .forex-pair {
      font-family: var(--font-mono);
      font-weight: 700;
      margin-bottom: 4px;
    }

    .forex-rate {
      font-size: 14px;
      font-family: var(--font-mono);
    }

    .forex-change {
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="forex-header">
      <div class="forex-title">Forex Dashboard</div>
      <div class="text-mono" id="timestamp">--</div>
    </div>

    <div class="forex-grid" id="forexGrid">
      <div class="empty-state">Loading forex quotes...</div>
    </div>
  </div>

<script>
${getBaseScripts()}

function render(data) {
  if (data.error) {
    document.getElementById('forexGrid').innerHTML = '<div class="empty-state">' + data.error + '</div>';
    requestAnimationFrame(reportHeight);
    return;
  }
  const quotes = data.quotes || data || [];
  if (!Array.isArray(quotes)) return;

  document.getElementById('timestamp').textContent = quotes[0]?.timestamp
    ? new Date(quotes[0].timestamp).toLocaleTimeString()
    : '--';

  const cards = quotes.map((q) => {
    const changeClass = q.change >= 0 ? 'positive' : 'negative';
    return '<div class="forex-card">' +
      '<div class="forex-pair">' + escapeHtml(q.pair || '--') + '</div>' +
      '<div class="forex-rate">' + formatNumber(q.rate || 0, 4) + '</div>' +
      '<div class="forex-change ' + changeClass + '">' +
        (q.change >= 0 ? '+' : '') + formatNumber(q.change || 0, 4) +
        ' (' + formatPercent(q.changePercent || 0) + ')' +
      '</div>' +
      '<div class="text-xs text-muted">H ' + formatNumber(q.high || 0, 4) + ' / L ' + formatNumber(q.low || 0, 4) + '</div>' +
    '</div>';
  }).join('');

  document.getElementById('forexGrid').innerHTML = cards || '<div class="empty-state">No quotes</div>';
  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (Array.isArray(data) || data.quotes || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing forex data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
