/**
 * Insider Activity View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getInsiderActivityViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Insider Activity")}
  <style>
    .insider-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .insider-title {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-sm);
      padding: var(--space-md);
    }

    .summary-card {
      padding: var(--space-sm);
      border: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .summary-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: 14px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .insider-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .insider-table th,
    .insider-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
    }

    .insider-table th {
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-size: 10px;
      color: var(--text-muted);
    }

    .type-buy { color: var(--accent-green); }
    .type-sell { color: var(--accent-red); }
  </style>
</head>
<body>
  <div class="card">
    <div class="insider-header">
      <div class="insider-title" id="ticker">---</div>
      <div class="text-mono" id="lastUpdated">Latest activity</div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">Net Shares</div>
        <div class="summary-value" id="netShares">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Net Value</div>
        <div class="summary-value" id="netValue">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Buys / Sells</div>
        <div class="summary-value" id="buysSells">--</div>
      </div>
    </div>

    <div class="data-table-container">
      <table class="insider-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Type</th>
            <th>Shares</th>
            <th>Value</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="transactionsBody">
          <tr><td colspan="6" class="empty-state">Loading transactions...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

<script>
${getBaseScripts()}

function render(data) {
  if (data.error) {
    document.getElementById('ticker').textContent = data.ticker || '---';
    document.getElementById('netShares').textContent = '--';
    document.getElementById('netValue').textContent = '--';
    document.getElementById('buysSells').textContent = '--';
    document.getElementById('transactionsBody').innerHTML = '<tr><td colspan="6" class="empty-state">' + data.error + '</td></tr>';
    requestAnimationFrame(reportHeight);
    return;
  }
  document.getElementById('ticker').textContent = data.ticker || '---';

  const summary = data.summary || { netShares: 0, netValue: 0, buys: 0, sells: 0 };
  document.getElementById('netShares').textContent = formatNumber(summary.netShares);
  document.getElementById('netValue').textContent = formatCurrency(summary.netValue);
  document.getElementById('buysSells').textContent = summary.buys + ' / ' + summary.sells;

  const rows = (data.transactions || []).map((t) => {
    const typeClass = t.transactionType === 'Buy' ? 'type-buy' : t.transactionType === 'Sell' ? 'type-sell' : '';
    return '<tr>' +
      '<td>' + escapeHtml(t.name || 'Insider') + '</td>' +
      '<td>' + escapeHtml(t.title || '') + '</td>' +
      '<td class="' + typeClass + '">' + escapeHtml(t.transactionType || 'Other') + '</td>' +
      '<td class="text-mono">' + formatNumber(t.shares) + '</td>' +
      '<td class="text-mono">' + formatCurrency(t.totalValue) + '</td>' +
      '<td>' + (t.transactionDate ? new Date(t.transactionDate).toLocaleDateString() : '--') + '</td>' +
    '</tr>';
  }).join('');

  document.getElementById('transactionsBody').innerHTML = rows || '<tr><td colspan="6" class="empty-state">No transactions</td></tr>';
  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (data.transactions || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing insider data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
