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
    
    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--positive);
    }
    
    .live-dot {
      width: 6px;
      height: 6px;
      background: var(--positive);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .market-closed .live-dot {
      background: var(--text-muted);
      animation: none;
    }
    
    .market-closed {
      color: var(--text-muted);
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    
    .price-flash {
      animation: flash 0.3s ease-out;
    }
    
    @keyframes flash {
      0% { background: rgba(59, 130, 246, 0.3); }
      100% { background: transparent; }
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
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="live-indicator" id="live-indicator">
          <span class="live-dot"></span>
          <span id="live-status">LIVE</span>
        </span>
        <span id="last-updated">Updated just now</span>
      </div>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let quoteData = null;
    let currentTicker = null;
    let refreshInterval = null;
    const REFRESH_INTERVAL_MS = 5000; // 5 seconds
    
    // Check if US market is open (9:30 AM - 4:00 PM ET, Mon-Fri)
    function isMarketOpen() {
      const now = new Date();
      const etOffset = -5; // Eastern Time offset (adjust for DST if needed)
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const et = new Date(utc + (3600000 * etOffset));
      
      const day = et.getDay();
      const hours = et.getHours();
      const minutes = et.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      // Market hours: 9:30 AM (570 min) to 4:00 PM (960 min), Mon-Fri
      const isWeekday = day >= 1 && day <= 5;
      const isDuringHours = timeInMinutes >= 570 && timeInMinutes < 960;
      
      return isWeekday && isDuringHours;
    }
    
    function updateLiveIndicator() {
      const indicator = document.getElementById('live-indicator');
      const status = document.getElementById('live-status');
      
      if (isMarketOpen()) {
        indicator.classList.remove('market-closed');
        status.textContent = 'LIVE';
      } else {
        indicator.classList.add('market-closed');
        status.textContent = 'CLOSED';
      }
    }
    
    async function refreshQuote() {
      if (!currentTicker) return;
      
      try {
        const response = await fetch('/api/mcp/bloomberg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'equity_quote',
              arguments: { ticker: currentTicker }
            },
            id: Date.now()
          })
        });
        
        const result = await response.json();
        if (result?.result?.content?.[0]?.text) {
          const data = JSON.parse(result.result.content[0].text);
          if (data.ticker && !data.error) {
            // Check if price changed
            const priceChanged = quoteData && quoteData.price !== data.price;
            renderQuote(data, priceChanged);
          }
        }
      } catch (err) {
        console.error('Error refreshing quote:', err);
      }
    }
    
    function startRealTimeUpdates() {
      // Clear any existing interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Update live indicator immediately
      updateLiveIndicator();
      
      // Only start polling if market is open
      if (isMarketOpen()) {
        refreshInterval = setInterval(() => {
          if (isMarketOpen()) {
            refreshQuote();
          } else {
            updateLiveIndicator();
          }
        }, REFRESH_INTERVAL_MS);
      }
      
      // Check market status every minute
      setInterval(updateLiveIndicator, 60000);
    }
    
    function renderQuote(data, flash = false) {
      const previousPrice = quoteData?.price;
      quoteData = data;
      currentTicker = data.ticker;
      
      document.getElementById('ticker').textContent = data.ticker;
      document.getElementById('company-name').textContent = data.name;
      
      const priceEl = document.getElementById('current-price');
      priceEl.textContent = formatCurrency(data.price).replace('$', '');
      
      // Flash effect on price change
      if (flash && previousPrice !== data.price) {
        priceEl.classList.add('price-flash');
        setTimeout(() => priceEl.classList.remove('price-flash'), 300);
      }
      
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
      
      // Start real-time updates after first render
      if (!refreshInterval) {
        startRealTimeUpdates();
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
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    });
  </script>
</body>
</html>`;
}
