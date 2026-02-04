/**
 * Commodities Dashboard View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getCommoditiesDashboardViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Commodities Dashboard")}
  <style>
    .commodities-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .commodities-title {
      font-size: 16px;
      font-weight: 700;
    }

    .commodities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: var(--space-sm);
      padding: var(--space-md);
    }

    .commodity-card {
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      padding: var(--space-sm);
    }

    .commodity-name {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .commodity-price {
      font-size: 14px;
      font-family: var(--font-mono);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="commodities-header">
      <div class="commodities-title">Commodities</div>
      <div class="text-mono" id="timestamp">--</div>
    </div>

    <div class="commodities-grid" id="commoditiesGrid">
      <div class="empty-state">Loading commodities...</div>
    </div>
  </div>

<script>
${getBaseScripts()}

function render(data) {
  if (data.error) {
    document.getElementById('commoditiesGrid').innerHTML = '<div class="empty-state">' + data.error + '</div>';
    requestAnimationFrame(reportHeight);
    return;
  }
  const items = data.items || data || [];
  if (!Array.isArray(items)) return;

  document.getElementById('timestamp').textContent = items[0]?.timestamp
    ? new Date(items[0].timestamp).toLocaleTimeString()
    : '--';

  const cards = items.map((item) => {
    const changeClass = item.change >= 0 ? 'positive' : 'negative';
    return '<div class="commodity-card">' +
      '<div class="commodity-name">' + escapeHtml(item.name || item.symbol) + '</div>' +
      '<div class="commodity-price">' + formatNumber(item.price || 0, 2) + ' ' + escapeHtml(item.unit || '') + '</div>' +
      '<div class="text-xs ' + changeClass + '">' +
        (item.change >= 0 ? '+' : '') + formatNumber(item.change || 0, 2) +
        ' (' + formatPercent(item.changePercent || 0) + ')' +
      '</div>' +
      '<div class="text-xs text-muted">' + escapeHtml(item.category || '') + '</div>' +
    '</div>';
  }).join('');

  document.getElementById('commoditiesGrid').innerHTML = cards || '<div class="empty-state">No data</div>';
  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (Array.isArray(data) || data.items || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing commodities data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
