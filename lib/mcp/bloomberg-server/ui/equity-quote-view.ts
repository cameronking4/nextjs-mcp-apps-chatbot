/**
 * Equity Quote View - Bloomberg Terminal UI
 * 
 * Displays a compact quote card with price, change, and key metrics.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getEquityQuoteViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Equity Quote')}
  <style>
    .quote-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: var(--space-md);
      border-bottom: 1px solid var(--border);
    }
    
    .ticker-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .ticker-symbol {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }
    
    .company-name {
      font-size: 12px;
      color: var(--text-muted);
    }
    
    .price-info {
      text-align: right;
    }
    
    .current-price {
      font-size: 24px;
      font-weight: 700;
      font-family: var(--font-mono);
    }
    
    .price-change {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-xs);
      font-size: 13px;
      font-family: var(--font-mono);
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-xs);
      padding: var(--space-md);
    }
    
    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: var(--space-xs);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
    }
    
    .metric-label {
      font-size: 9px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .metric-value {
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .sparkline-container {
      padding: 0 var(--space-md) var(--space-md);
    }
    
    .sparkline-svg {
      width: 100%;
      height: 40px;
    }
    
    .sparkline-path {
      fill: none;
      stroke: var(--accent-blue);
      stroke-width: 1.5;
    }
    
    .sparkline-area {
      fill: var(--accent-blue);
      opacity: 0.1;
    }
    
    .quote-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-xs) var(--space-md);
      background: var(--bg-secondary);
      font-size: 10px;
      color: var(--text-muted);
    }
    
    .exchange-badge {
      display: inline-flex;
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="card" id="quote-card">
    <div class="quote-header">
      <div class="ticker-info">
        <span class="ticker-symbol" id="ticker">---</span>
        <span class="company-name" id="company-name">Loading...</span>
      </div>
      <div class="price-info">
        <div class="current-price" id="current-price">---.--</div>
        <div class="price-change" id="price-change">
          <span id="change-value">+0.00</span>
          <span id="change-percent">(+0.00%)</span>
        </div>
      </div>
    </div>
    
    <div class="metrics-grid" id="metrics-grid">
      <div class="metric-item">
        <span class="metric-label">Open</span>
        <span class="metric-value" id="metric-open">---.--</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">High</span>
        <span class="metric-value" id="metric-high">---.--</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Low</span>
        <span class="metric-value" id="metric-low">---.--</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Volume</span>
        <span class="metric-value" id="metric-volume">---</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Mkt Cap</span>
        <span class="metric-value" id="metric-market-cap">---</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">P/E</span>
        <span class="metric-value" id="metric-pe">--</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">EPS</span>
        <span class="metric-value" id="metric-eps">--</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Yield</span>
        <span class="metric-value" id="metric-yield">--%</span>
      </div>
    </div>
    
    <div class="sparkline-container">
      <svg class="sparkline-svg" id="sparkline" viewBox="0 0 200 40" preserveAspectRatio="none">
        <path class="sparkline-area" id="sparkline-area"></path>
        <path class="sparkline-path" id="sparkline-path"></path>
      </svg>
    </div>
    
    <div class="quote-footer">
      <span class="exchange-badge" id="exchange">NASDAQ</span>
      <span id="last-updated">Updated just now</span>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let quoteData = null;
    
    function renderQuote(data) {
      quoteData = data;
      
      document.getElementById('ticker').textContent = data.ticker;
      document.getElementById('company-name').textContent = data.name;
      document.getElementById('current-price').textContent = formatCurrency(data.price).replace('$', '');
      
      const changeEl = document.getElementById('price-change');
      const changeClass = getChangeClass(data.change);
      changeEl.className = 'price-change ' + changeClass;
      document.getElementById('change-value').textContent = (data.change >= 0 ? '+' : '') + formatNumber(data.change);
      document.getElementById('change-percent').textContent = '(' + formatPercent(data.changePercent) + ')';
      
      document.getElementById('metric-open').textContent = formatNumber(data.open);
      document.getElementById('metric-high').textContent = formatNumber(data.high);
      document.getElementById('metric-low').textContent = formatNumber(data.low);
      document.getElementById('metric-volume').textContent = formatLargeNumber(data.volume);
      document.getElementById('metric-market-cap').textContent = formatLargeNumber(data.marketCap);
      document.getElementById('metric-pe').textContent = data.pe > 0 ? formatNumber(data.pe, 1) : 'N/A';
      document.getElementById('metric-eps').textContent = formatNumber(data.eps);
      document.getElementById('metric-yield').textContent = formatNumber(data.dividendYield, 2) + '%';
      
      document.getElementById('exchange').textContent = data.exchange;
      document.getElementById('last-updated').textContent = 'Updated ' + timeAgo(data.lastUpdated);
      
      if (data.sparkline && data.sparkline.length > 0) {
        renderSparkline(data.sparkline);
      }
      
      requestAnimationFrame(reportHeight);
    }
    
    function renderSparkline(points) {
      const width = 200;
      const height = 40;
      const padding = 2;
      
      const min = Math.min(...points);
      const max = Math.max(...points);
      const range = max - min || 1;
      
      const xStep = (width - padding * 2) / (points.length - 1);
      
      let pathD = '';
      let areaD = '';
      
      points.forEach((p, i) => {
        const x = padding + i * xStep;
        const y = height - padding - ((p - min) / range) * (height - padding * 2);
        
        if (i === 0) {
          pathD += 'M ' + x + ' ' + y;
          areaD += 'M ' + x + ' ' + (height - padding) + ' L ' + x + ' ' + y;
        } else {
          pathD += ' L ' + x + ' ' + y;
          areaD += ' L ' + x + ' ' + y;
        }
        
        if (i === points.length - 1) {
          areaD += ' L ' + x + ' ' + (height - padding) + ' Z';
        }
      });
      
      document.getElementById('sparkline-path').setAttribute('d', pathD);
      document.getElementById('sparkline-area').setAttribute('d', areaD);
    }
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.ticker) {
            renderQuote(data);
          }
        } catch (err) {
          console.error('Error parsing quote data:', err);
        }
      }
      
      if (type === 'mcp:toolInput' && payload?.arguments) {
        // Initial render with input args if available
      }
    });
  </script>
</body>
</html>`;
}
