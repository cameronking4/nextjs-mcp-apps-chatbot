/**
 * Dividend Calendar View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getDividendCalendarViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Dividend Calendar")}
  <style>
    .dividend-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .dividend-title {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .summary-row {
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

    .dividend-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .dividend-table th,
    .dividend-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
    }

    .dividend-table th {
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-size: 10px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="dividend-header">
      <div class="dividend-title" id="ticker">---</div>
      <div class="text-mono" id="nextExDate">Next Ex-Date: --</div>
    </div>

    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-label">Latest Dividend</div>
        <div class="summary-value" id="latestDividend">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Dividend Yield</div>
        <div class="summary-value" id="dividendYield">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Frequency</div>
        <div class="summary-value" id="dividendFrequency">--</div>
      </div>
    </div>

    <div class="data-table-container">
      <table class="dividend-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody id="historyBody">
          <tr><td colspan="2" class="empty-state">Loading dividends...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

<script>
${getBaseScripts()}

function render(data) {
  if (data.error) {
    document.getElementById('ticker').textContent = data.ticker || '---';
    document.getElementById('nextExDate').textContent = 'Next Ex-Date: --';
    document.getElementById('latestDividend').textContent = '--';
    document.getElementById('dividendYield').textContent = '--';
    document.getElementById('dividendFrequency').textContent = '--';
    document.getElementById('historyBody').innerHTML = '<tr><td colspan="2" class="empty-state">' + data.error + '</td></tr>';
    requestAnimationFrame(reportHeight);
    return;
  }
  document.getElementById('ticker').textContent = data.ticker || '---';
  if (data.nextDividend) {
    document.getElementById('nextExDate').textContent = 'Next Ex-Date: ' + new Date(data.nextDividend.exDate).toLocaleDateString();
    document.getElementById('latestDividend').textContent = formatCurrency(data.nextDividend.amount);
    document.getElementById('dividendYield').textContent = formatPercent(data.nextDividend.yield || 0);
    document.getElementById('dividendFrequency').textContent = data.nextDividend.frequency || '--';
  }

  const history = data.history || [];
  const rows = history.map((item) => {
    return '<tr>' +
      '<td>' + (item.date ? new Date(item.date).toLocaleDateString() : '--') + '</td>' +
      '<td class="text-mono">' + formatCurrency(item.amount) + '</td>' +
    '</tr>';
  }).join('');

  document.getElementById('historyBody').innerHTML = rows || '<tr><td colspan="2" class="empty-state">No dividend history</td></tr>';
  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (data.history || data.nextDividend || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing dividend data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
