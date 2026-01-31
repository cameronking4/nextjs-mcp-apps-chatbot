/**
 * Financial Ratios View
 * Displays detailed financial ratios organized by category
 */

import { getBaseHead, getBaseScripts, getBaseStyles } from "./base";

export function getRatiosViewHtml(): string {
  return `<!DOCTYPE html>
<html>
${getBaseHead("Financial Ratios")}
<style>
${getBaseStyles()}

.ratios-container {
  padding: 12px;
}

.ratios-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.ticker-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ticker-symbol {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.company-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.ratios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.ratio-section {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

.ratio-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ratio-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ratio-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.ratio-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.ratio-value.positive {
  color: var(--green);
}

.ratio-value.negative {
  color: var(--red);
}

.ratio-value.neutral {
  color: var(--text-secondary);
}

.actions-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 500;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
</style>
<body>
  <div class="ratios-container">
    <div class="ratios-header">
      <div class="ticker-info">
        <span class="ticker-symbol" id="tickerSymbol">---</span>
        <span class="company-name" id="companyName"></span>
      </div>
    </div>
    <div class="ratios-grid" id="ratiosGrid">
      <div class="ratio-section">
        <div class="section-title">Loading...</div>
      </div>
    </div>
    <div class="actions-row">
      <button class="action-btn" id="viewChart">View Chart</button>
      <button class="action-btn" id="compareBtn">Compare Peers</button>
      <button class="action-btn" id="researchBtn">Full Research</button>
    </div>
  </div>

<script>
${getBaseScripts()}

let currentTicker = '';

function formatRatioValue(value, type) {
  if (value === null || value === undefined) return { text: 'N/A', class: 'neutral' };
  
  if (type === 'percent') {
    const cls = value >= 0 ? 'positive' : 'negative';
    return { text: formatPercent(value / 100), class: cls };
  }
  if (type === 'ratio') {
    return { text: value.toFixed(2) + 'x', class: '' };
  }
  if (type === 'currency') {
    return { text: formatCurrency(value), class: '' };
  }
  if (type === 'days') {
    return { text: value.toFixed(0) + ' days', class: '' };
  }
  return { text: value.toFixed(2), class: '' };
}

function createSection(title, ratios) {
  const items = ratios.map(function(r) {
    const formatted = formatRatioValue(r.value, r.type);
    return '<div class="ratio-item">' +
      '<span class="ratio-label">' + escapeHtml(r.label) + '</span>' +
      '<span class="ratio-value ' + formatted.class + '">' + formatted.text + '</span>' +
    '</div>';
  }).join('');
  
  return '<div class="ratio-section">' +
    '<div class="section-title">' + escapeHtml(title) + '</div>' +
    '<div class="ratio-list">' + items + '</div>' +
  '</div>';
}

function render(data) {
  currentTicker = data.ticker || '';
  
  document.getElementById('tickerSymbol').textContent = data.ticker || '---';
  document.getElementById('companyName').textContent = data.companyName || '';
  
  const grid = document.getElementById('ratiosGrid');
  const v = data.valuation || {};
  const p = data.profitability || {};
  const l = data.leverage || {};
  const e = data.efficiency || {};
  const g = data.growth || {};
  
  let html = '';
  
  // Valuation
  html += createSection('Valuation', [
    { label: 'P/E Ratio', value: v.pe, type: 'ratio' },
    { label: 'Forward P/E', value: v.forwardPe, type: 'ratio' },
    { label: 'PEG Ratio', value: v.peg, type: 'ratio' },
    { label: 'Price/Sales', value: v.priceToSales, type: 'ratio' },
    { label: 'Price/Book', value: v.priceToBook, type: 'ratio' },
    { label: 'EV/EBITDA', value: v.evToEbitda, type: 'ratio' },
  ]);
  
  // Profitability
  html += createSection('Profitability', [
    { label: 'Gross Margin', value: p.grossMargin, type: 'percent' },
    { label: 'Operating Margin', value: p.operatingMargin, type: 'percent' },
    { label: 'Net Margin', value: p.netMargin, type: 'percent' },
    { label: 'ROE', value: p.roe, type: 'percent' },
    { label: 'ROA', value: p.roa, type: 'percent' },
    { label: 'ROIC', value: p.roic, type: 'percent' },
  ]);
  
  // Leverage
  html += createSection('Leverage', [
    { label: 'Debt/Equity', value: l.debtToEquity, type: 'ratio' },
    { label: 'Debt/Assets', value: l.debtToAssets, type: 'ratio' },
    { label: 'Current Ratio', value: l.currentRatio, type: 'ratio' },
    { label: 'Quick Ratio', value: l.quickRatio, type: 'ratio' },
    { label: 'Interest Coverage', value: l.interestCoverage, type: 'ratio' },
  ]);
  
  // Growth
  if (g) {
    html += createSection('Growth', [
      { label: 'Revenue Growth', value: g.revenueGrowth, type: 'percent' },
      { label: 'EPS Growth', value: g.epsGrowth, type: 'percent' },
      { label: 'Dividend Growth', value: g.dividendGrowth, type: 'percent' },
    ]);
  }
  
  grid.innerHTML = html;
  reportHeight();
}

document.getElementById('viewChart').addEventListener('click', function() {
  if (currentTicker) sendMessage('Show me a 1Y chart for ' + currentTicker);
});

document.getElementById('compareBtn').addEventListener('click', function() {
  if (currentTicker) sendMessage('Compare ' + currentTicker + ' with its peers');
});

document.getElementById('researchBtn').addEventListener('click', function() {
  if (currentTicker) sendMessage('Full research on ' + currentTicker);
});

window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'mcp:toolResult') {
    var payload = event.data.payload;
    // Parse the nested JSON structure
    if (payload && payload.content && payload.content[0] && payload.content[0].text) {
      try {
        var data = JSON.parse(payload.content[0].text);
        render(data);
      } catch (err) {
        console.error('Error parsing ratios data:', err);
      }
    } else if (payload && payload.ticker) {
      // Direct data format
      render(payload);
    }
  }
});

initTheme();
</script>
</body>
</html>`;
}
