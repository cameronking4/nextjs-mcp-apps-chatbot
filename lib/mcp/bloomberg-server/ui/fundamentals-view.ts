/**
 * Fundamentals View
 * Displays company fundamentals including valuation, profitability, and financial metrics
 */

import { getBaseHead, getBaseScripts, getBaseStyles } from "./base";

export function getFundamentalsViewHtml(): string {
  return `<!DOCTYPE html>
<html>
${getBaseHead("Fundamentals")}
<style>
${getBaseStyles()}

.fundamentals-container {
  padding: 12px;
}

.company-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.company-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-ticker {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.company-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.company-sector {
  font-size: 11px;
  color: var(--text-muted);
}

.price-info {
  text-align: right;
}

.current-price {
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-mono);
}

.price-change {
  font-size: 12px;
  font-family: var(--font-mono);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.metrics-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.metric-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.metric-value.positive { color: var(--accent-green); }
.metric-value.negative { color: var(--accent-red); }

.actions-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
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
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
}
</style>
<body>
  <div class="fundamentals-container">
    <div class="company-header">
      <div class="company-info">
        <span class="company-ticker" id="ticker">---</span>
        <span class="company-name" id="companyName"></span>
        <span class="company-sector" id="sector"></span>
      </div>
      <div class="price-info">
        <div class="current-price" id="price">--</div>
        <div class="price-change" id="change"></div>
      </div>
    </div>
    
    <div class="metrics-grid" id="metricsGrid">
      <div class="empty-state">Loading fundamentals...</div>
    </div>
    
    <div class="actions-row">
      <button class="action-btn" id="viewChart">View Chart</button>
      <button class="action-btn" id="viewRatios">Detailed Ratios</button>
      <button class="action-btn" id="compareBtn">Compare</button>
    </div>
  </div>

<script>
${getBaseScripts()}

let currentTicker = '';

function formatMetricValue(value, type) {
  if (value === null || value === undefined) return 'N/A';
  
  if (type === 'currency') return formatCurrency(value);
  if (type === 'percent') return formatPercent(value);
  if (type === 'ratio') return value.toFixed(2) + 'x';
  if (type === 'large') return formatLargeNumber(value);
  if (type === 'number') return formatNumber(value);
  return String(value);
}

function createMetricRow(label, value, type) {
  const formatted = formatMetricValue(value, type);
  let cls = '';
  if (type === 'percent' && value !== null) {
    cls = value >= 0 ? 'positive' : 'negative';
  }
  return '<div class="metric-row">' +
    '<span class="metric-label">' + escapeHtml(label) + '</span>' +
    '<span class="metric-value ' + cls + '">' + formatted + '</span>' +
  '</div>';
}

function createSection(title, metrics) {
  const rows = metrics.map(function(m) {
    return createMetricRow(m.label, m.value, m.type);
  }).join('');
  
  return '<div class="metrics-section">' +
    '<div class="section-title">' + escapeHtml(title) + '</div>' +
    '<div class="metrics-list">' + rows + '</div>' +
  '</div>';
}

function render(data) {
  const eq = data.equity || {};
  const fund = data.fundamentals || {};
  
  currentTicker = eq.ticker || fund.ticker || '';
  
  // Header
  document.getElementById('ticker').textContent = currentTicker;
  document.getElementById('companyName').textContent = eq.name || '';
  document.getElementById('sector').textContent = (eq.sector || '') + (eq.industry ? ' • ' + eq.industry : '');
  
  if (eq.price) {
    document.getElementById('price').textContent = formatCurrency(eq.price);
    const changeEl = document.getElementById('change');
    const changeText = formatCurrency(eq.change || 0) + ' (' + formatPercent(eq.changePercent || 0) + ')';
    changeEl.textContent = changeText;
    changeEl.className = 'price-change ' + getChangeClass(eq.change || 0);
  }
  
  // Metrics grid
  const grid = document.getElementById('metricsGrid');
  let html = '';
  
  // Valuation
  html += createSection('Valuation', [
    { label: 'P/E Ratio', value: fund.pe || eq.pe, type: 'ratio' },
    { label: 'Forward P/E', value: fund.forwardPe, type: 'ratio' },
    { label: 'PEG Ratio', value: fund.peg, type: 'ratio' },
    { label: 'Price/Book', value: fund.priceToBook, type: 'ratio' },
    { label: 'Price/Sales', value: fund.priceToSales, type: 'ratio' },
    { label: 'EV/EBITDA', value: fund.evToEbitda, type: 'ratio' },
  ]);
  
  // Profitability
  html += createSection('Profitability', [
    { label: 'Gross Margin', value: fund.grossMargin, type: 'percent' },
    { label: 'Operating Margin', value: fund.operatingMargin, type: 'percent' },
    { label: 'Net Margin', value: fund.netMargin, type: 'percent' },
    { label: 'ROE', value: fund.roe, type: 'percent' },
    { label: 'ROA', value: fund.roa, type: 'percent' },
  ]);
  
  // Per Share
  html += createSection('Per Share', [
    { label: 'EPS (TTM)', value: fund.eps || eq.eps, type: 'currency' },
    { label: 'Book Value', value: fund.bookValue, type: 'currency' },
    { label: 'Dividend', value: eq.dividend, type: 'currency' },
    { label: 'Dividend Yield', value: eq.dividendYield, type: 'percent' },
  ]);
  
  // Financial Health
  html += createSection('Financial Health', [
    { label: 'Market Cap', value: eq.marketCap, type: 'large' },
    { label: 'Debt/Equity', value: fund.debtToEquity, type: 'ratio' },
    { label: 'Current Ratio', value: fund.currentRatio, type: 'ratio' },
    { label: 'Quick Ratio', value: fund.quickRatio, type: 'ratio' },
  ]);
  
  grid.innerHTML = html;
  reportHeight();
}

document.getElementById('viewChart').addEventListener('click', function() {
  if (currentTicker) sendMessage('Show me a 1Y chart for ' + currentTicker);
});

document.getElementById('viewRatios').addEventListener('click', function() {
  if (currentTicker) sendMessage('Show detailed financial ratios for ' + currentTicker);
});

document.getElementById('compareBtn').addEventListener('click', function() {
  if (currentTicker) sendMessage('Compare ' + currentTicker + ' with its peers');
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
        console.error('Error parsing fundamentals data:', err);
      }
    } else if (payload && (payload.equity || payload.fundamentals)) {
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
