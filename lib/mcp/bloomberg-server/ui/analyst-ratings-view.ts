/**
 * Analyst Ratings View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getAnalystRatingsViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Analyst Ratings")}
  <style>
    .ratings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .ratings-title {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .ratings-ticker {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .ratings-consensus {
      font-size: 11px;
      color: var(--text-muted);
    }

    .ratings-summary {
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
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .ratings-bars {
      padding: 0 var(--space-md) var(--space-md);
    }

    .bar-row {
      display: grid;
      grid-template-columns: 90px 1fr 50px;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-xs);
    }

    .bar-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .bar-track {
      height: 8px;
      background: var(--bg-tertiary);
      position: relative;
    }

    .bar-fill {
      height: 100%;
      background: var(--accent-blue);
      width: 0;
    }

    .bar-value {
      text-align: right;
      font-family: var(--font-mono);
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="ratings-header">
      <div class="ratings-title">
        <div class="ratings-ticker" id="ticker">---</div>
        <div class="ratings-consensus" id="consensus">Consensus: --</div>
      </div>
      <div class="text-mono" id="analystCount">-- analysts</div>
    </div>

    <div class="ratings-summary">
      <div class="summary-card">
        <div class="summary-label">Mean Target</div>
        <div class="summary-value" id="priceTarget">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Strong Buy + Buy</div>
        <div class="summary-value" id="bullishCount">--</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Sell + Strong Sell</div>
        <div class="summary-value" id="bearishCount">--</div>
      </div>
    </div>

    <div class="ratings-bars" id="bars">
      <div class="empty-state">Loading ratings...</div>
    </div>
  </div>

<script>
${getBaseScripts()}

function renderBars(data) {
  const rows = [
    { label: 'Strong Buy', value: data.strongBuy || 0 },
    { label: 'Buy', value: data.buy || 0 },
    { label: 'Hold', value: data.hold || 0 },
    { label: 'Sell', value: data.sell || 0 },
    { label: 'Strong Sell', value: data.strongSell || 0 },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);

  document.getElementById('bars').innerHTML = rows.map((row) => {
    const width = Math.round((row.value / max) * 100);
    return '<div class="bar-row">' +
      '<div class="bar-label">' + row.label + '</div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div>' +
      '<div class="bar-value">' + row.value + '</div>' +
    '</div>';
  }).join('');
}

function render(data) {
  if (data.error) {
    document.getElementById('ticker').textContent = data.ticker || '---';
    document.getElementById('consensus').textContent = 'Consensus: --';
    document.getElementById('analystCount').textContent = '-- analysts';
    document.getElementById('priceTarget').textContent = '--';
    document.getElementById('bullishCount').textContent = '--';
    document.getElementById('bearishCount').textContent = '--';
    document.getElementById('bars').innerHTML = '<div class="empty-state">' + data.error + '</div>';
    requestAnimationFrame(reportHeight);
    return;
  }
  document.getElementById('ticker').textContent = data.ticker || '---';
  document.getElementById('consensus').textContent = 'Consensus: ' + (data.consensus || '--');
  document.getElementById('analystCount').textContent = (data.numberOfAnalysts || 0) + ' analysts';
  document.getElementById('priceTarget').textContent = data.priceTarget
    ? formatCurrency(data.priceTarget)
    : '--';

  document.getElementById('bullishCount').textContent = (data.strongBuy || 0) + (data.buy || 0);
  document.getElementById('bearishCount').textContent = (data.sell || 0) + (data.strongSell || 0);

  renderBars(data);
  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (data.consensus || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing analyst ratings data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
