/**
 * Technical Chart View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getTechnicalChartViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Technical Indicators")}
  <style>
    .tech-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .tech-title {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .tech-summary {
      padding: var(--space-md);
      border-bottom: 1px solid var(--border);
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-sm);
    }

    .summary-card {
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      padding: var(--space-sm);
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

    .tech-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .tech-table th,
    .tech-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: right;
      font-family: var(--font-mono);
    }

    .tech-table th:first-child,
    .tech-table td:first-child {
      text-align: left;
    }

    .tech-table th {
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-size: 10px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="tech-header">
      <div class="tech-title" id="ticker">---</div>
      <div class="text-mono" id="period">--</div>
    </div>

    <div class="tech-summary">
      <div class="summary-card">
        <div class="summary-label">Latest RSI</div>
        <div class="summary-value" id="latestRsi">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Latest MACD</div>
        <div class="summary-value" id="latestMacd">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Latest SMA 20</div>
        <div class="summary-value" id="latestSma">--</div>
      </div>
    </div>

    <div class="data-table-container">
      <table class="tech-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>RSI</th>
            <th>MACD</th>
            <th>Signal</th>
            <th>SMA 20</th>
          </tr>
        </thead>
        <tbody id="techBody">
          <tr><td colspan="5" class="empty-state">Loading indicators...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

<script>
${getBaseScripts()}

function render(data) {
  if (data.error) {
    document.getElementById('ticker').textContent = data.ticker || '---';
    document.getElementById('period').textContent = data.period || '--';
    document.getElementById('latestRsi').textContent = '--';
    document.getElementById('latestMacd').textContent = '--';
    document.getElementById('latestSma').textContent = '--';
    document.getElementById('techBody').innerHTML = '<tr><td colspan="5" class="empty-state">' + data.error + '</td></tr>';
    requestAnimationFrame(reportHeight);
    return;
  }
  document.getElementById('ticker').textContent = data.ticker || '---';
  document.getElementById('period').textContent = data.period || '--';

  const rsi = data.indicators?.rsi || [];
  const macd = data.indicators?.macd || { macd: [], signal: [] };
  const sma = data.indicators?.sma || {};
  const sma20 = sma[20] || [];

  const latestIndex = data.timestamps?.length ? data.timestamps.length - 1 : 0;
  document.getElementById('latestRsi').textContent = rsi[latestIndex] ? formatNumber(rsi[latestIndex]) : '--';
  document.getElementById('latestMacd').textContent = macd.macd?.[latestIndex] ? formatNumber(macd.macd[latestIndex], 4) : '--';
  document.getElementById('latestSma').textContent = sma20[latestIndex] ? formatNumber(sma20[latestIndex], 2) : '--';

  const timestamps = data.timestamps || [];
  const startIndex = Math.max(0, timestamps.length - 15);
  const rows = timestamps.slice(startIndex).map((ts, idxOffset) => {
    const index = startIndex + idxOffset;
    return '<tr>' +
      '<td>' + new Date(ts).toLocaleDateString() + '</td>' +
      '<td>' + (rsi[index] ? formatNumber(rsi[index]) : '--') + '</td>' +
      '<td>' + (macd.macd?.[index] ? formatNumber(macd.macd[index], 4) : '--') + '</td>' +
      '<td>' + (macd.signal?.[index] ? formatNumber(macd.signal[index], 4) : '--') + '</td>' +
      '<td>' + (sma20[index] ? formatNumber(sma20[index], 2) : '--') + '</td>' +
    '</tr>';
  }).join('');

  document.getElementById('techBody').innerHTML = rows || '<tr><td colspan="5" class="empty-state">No indicator data</td></tr>';
  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (data.indicators || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing technical data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
