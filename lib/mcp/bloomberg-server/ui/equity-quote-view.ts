/**
 * Equity Quote View - Bloomberg Terminal UI
 * 
 * Displays an enhanced quote card with:
 * - Interactive price chart with timeframe selector
 * - Comprehensive metrics (12 items in 4x3 grid)
 * - Day range and 52-week range visual indicators
 * - Sector/industry badges
 * - Quick action buttons
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
    
    .sector-badges {
      display: flex;
      gap: 4px;
      margin-top: 4px;
      flex-wrap: wrap;
    }
    
    .sector-badge {
      display: inline-flex;
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      font-size: 10px;
      color: var(--text-secondary);
      font-weight: 500;
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
    
    /* Chart Section */
    .chart-section {
      border-bottom: 1px solid var(--border);
    }
    
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-xs) var(--space-md);
      background: var(--bg-secondary);
    }
    
    .timeframe-selector {
      display: flex;
      gap: 2px;
    }
    
    .timeframe-btn {
      padding: 3px 8px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 2px;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .timeframe-btn:hover {
      color: var(--text-primary);
      background: var(--bg-tertiary);
    }
    
    .timeframe-btn.active {
      color: var(--text-primary);
      background: var(--bg-primary);
      border-color: var(--border);
    }
    
    .chart-date-range {
      font-size: 10px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
    
    .chart-container {
      position: relative;
      padding: var(--space-sm) var(--space-md);
      height: 100px;
    }
    
    .chart-svg {
      width: 100%;
      height: 100%;
    }
    
    .chart-line {
      fill: none;
      stroke-width: 1.5;
    }
    
    .chart-line.positive {
      stroke: var(--accent-green);
    }
    
    .chart-line.negative {
      stroke: var(--accent-red);
    }
    
    .chart-area {
      opacity: 0.15;
    }
    
    .chart-area.positive {
      fill: var(--accent-green);
    }
    
    .chart-area.negative {
      fill: var(--accent-red);
    }
    
    .chart-crosshair {
      stroke: var(--text-muted);
      stroke-width: 1;
      stroke-dasharray: 2, 2;
      opacity: 0;
      pointer-events: none;
    }
    
    .chart-crosshair.visible {
      opacity: 0.5;
    }
    
    .chart-dot {
      opacity: 0;
      pointer-events: none;
    }
    
    .chart-dot.visible {
      opacity: 1;
    }
    
    .chart-dot.positive {
      fill: var(--accent-green);
    }
    
    .chart-dot.negative {
      fill: var(--accent-red);
    }
    
    .chart-tooltip {
      position: absolute;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 2px;
      padding: 4px 8px;
      font-size: 10px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s ease;
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      white-space: nowrap;
    }
    
    .chart-tooltip.visible {
      opacity: 1;
    }
    
    .tooltip-date {
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    
    .tooltip-price {
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .tooltip-volume {
      color: var(--text-muted);
      font-size: 9px;
    }
    
    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border);
      border-bottom: 1px solid var(--border);
    }
    
    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
      padding: var(--space-xs) var(--space-sm);
      background: var(--bg-primary);
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
    
    .metric-value.small {
      font-size: 10px;
    }
    
    /* Range Indicators */
    .range-section {
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
    }
    
    .range-row {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-xs);
    }
    
    .range-row:last-child {
      margin-bottom: 0;
    }
    
    .range-label {
      font-size: 9px;
      color: var(--text-muted);
      text-transform: uppercase;
      width: 55px;
      flex-shrink: 0;
    }
    
    .range-bar {
      flex: 1;
      height: 6px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    }
    
    .range-fill {
      position: absolute;
      top: 0;
      height: 100%;
      background: var(--accent-blue);
      opacity: 0.3;
      border-radius: 3px;
    }
    
    .range-marker {
      position: absolute;
      top: -2px;
      width: 3px;
      height: 10px;
      background: var(--accent-blue);
      border-radius: 1px;
      transform: translateX(-50%);
    }
    
    .range-values {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      font-family: var(--font-mono);
      color: var(--text-muted);
      width: 90px;
      flex-shrink: 0;
    }
    
    /* Footer */
    .quote-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-xs) var(--space-md);
      background: var(--bg-secondary);
    }
    
    .footer-left {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    
    .exchange-badge {
      display: inline-flex;
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      font-size: 10px;
      font-weight: 500;
      color: var(--text-secondary);
    }
    
    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
    }
    
    .live-dot {
      width: 6px;
      height: 6px;
      background: var(--accent-green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .market-closed .live-dot {
      background: var(--text-muted);
      animation: none;
    }
    
    .live-indicator.market-closed {
      color: var(--text-muted);
    }
    
    .live-indicator:not(.market-closed) {
      color: var(--accent-green);
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    
    .footer-right {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    
    .last-updated {
      font-size: 10px;
      color: var(--text-muted);
    }
    
    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-md) var(--space-sm);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
    }
    
    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 10px;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 2px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .action-btn:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-color: var(--text-muted);
    }
    
    .action-btn svg {
      width: 12px;
      height: 12px;
    }
    
    .price-flash {
      animation: flash 0.3s ease-out;
    }
    
    @keyframes flash {
      0% { background: rgba(59, 130, 246, 0.3); }
      100% { background: transparent; }
    }
    
    /* Loading state */
    .chart-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
      font-size: 11px;
    }
    
    .chart-loading::after {
      content: '';
      width: 14px;
      height: 14px;
      margin-left: 8px;
      border: 2px solid var(--border);
      border-top-color: var(--accent-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="card" id="quote-card">
    <div class="quote-header">
      <div class="ticker-info">
        <span class="ticker-symbol" id="ticker">---</span>
        <span class="company-name" id="company-name">Loading...</span>
        <div class="sector-badges" id="sector-badges"></div>
      </div>
      <div class="price-info">
        <div class="current-price" id="current-price">---.--</div>
        <div class="price-change" id="price-change">
          <span id="change-value">+0.00</span>
          <span id="change-percent">(+0.00%)</span>
        </div>
      </div>
    </div>
    
    <div class="chart-section">
      <div class="chart-header">
        <div class="timeframe-selector" id="timeframe-selector">
          <button type="button" class="timeframe-btn active" data-tf="1D">1D</button>
          <button type="button" class="timeframe-btn" data-tf="1W">1W</button>
          <button type="button" class="timeframe-btn" data-tf="1M">1M</button>
        </div>
        <span class="chart-date-range" id="chart-date-range">--</span>
      </div>
      <div class="chart-container" id="chart-container">
        <svg class="chart-svg" id="chart-svg" viewBox="0 0 400 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradientPositive" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:var(--accent-green);stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:var(--accent-green);stop-opacity:0" />
            </linearGradient>
            <linearGradient id="chartGradientNegative" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:var(--accent-red);stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:var(--accent-red);stop-opacity:0" />
            </linearGradient>
          </defs>
          <path class="chart-area" id="chart-area"></path>
          <path class="chart-line" id="chart-line"></path>
          <line class="chart-crosshair" id="crosshair-x" x1="0" y1="0" x2="0" y2="80"></line>
          <line class="chart-crosshair" id="crosshair-y" x1="0" y1="0" x2="400" y2="0"></line>
          <circle class="chart-dot" id="chart-dot" r="3" cx="0" cy="0"></circle>
        </svg>
        <div class="chart-tooltip" id="chart-tooltip">
          <div class="tooltip-date" id="tooltip-date">--</div>
          <div class="tooltip-price" id="tooltip-price">--</div>
          <div class="tooltip-volume" id="tooltip-volume">--</div>
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
        <span class="metric-label">Prev Close</span>
        <span class="metric-value" id="metric-prev-close">---.--</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Avg Volume</span>
        <span class="metric-value" id="metric-avg-volume">---</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Beta</span>
        <span class="metric-value" id="metric-beta">--</span>
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
      <div class="metric-item">
        <span class="metric-label">52W Range</span>
        <span class="metric-value small" id="metric-52w-range">-- - --</span>
      </div>
    </div>
    
    <div class="range-section">
      <div class="range-row">
        <span class="range-label">Day Range</span>
        <div class="range-bar">
          <div class="range-fill" id="day-range-fill"></div>
          <div class="range-marker" id="day-range-marker"></div>
        </div>
        <div class="range-values">
          <span id="day-low">--</span>
          <span id="day-high">--</span>
        </div>
      </div>
      <div class="range-row">
        <span class="range-label">52W Range</span>
        <div class="range-bar">
          <div class="range-fill" id="year-range-fill"></div>
          <div class="range-marker" id="year-range-marker"></div>
        </div>
        <div class="range-values">
          <span id="year-low">--</span>
          <span id="year-high">--</span>
        </div>
      </div>
    </div>
    
    <div class="quote-footer">
      <div class="footer-left">
        <span class="exchange-badge" id="exchange">---</span>
        <span class="live-indicator" id="live-indicator">
          <span class="live-dot"></span>
          <span id="live-status">--</span>
        </span>
      </div>
      <div class="footer-right">
        <span class="last-updated" id="last-updated">Updated --</span>
      </div>
    </div>
    
    <div class="action-buttons">
      <button type="button" class="action-btn" id="btn-chart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18M7 16l4-4 4 4 5-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        1Y Chart
      </button>
      <button type="button" class="action-btn" id="btn-news">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h10" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        News
      </button>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let quoteData = null;
    let chartPoints = [];
    let currentTicker = null;
    let currentTimeframe = '1D';
    let refreshInterval = null;
    let isLoadingChart = false;
    const REFRESH_INTERVAL_MS = 10000; // 10 seconds
    
    // Chart dimensions
    const chartWidth = 400;
    const chartHeight = 80;
    const chartPadding = { top: 5, right: 5, bottom: 5, left: 5 };
    
    // Check if US market is open (9:30 AM - 4:00 PM ET, Mon-Fri)
    function isMarketOpen() {
      const now = new Date();
      const etOffset = -5;
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const et = new Date(utc + (3600000 * etOffset));
      
      const day = et.getDay();
      const hours = et.getHours();
      const minutes = et.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
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
    
    async function fetchChartData(timeframe) {
      if (!currentTicker || isLoadingChart) return;
      
      isLoadingChart = true;
      
      try {
        const response = await fetch('/api/mcp/bloomberg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'equity_historical',
              arguments: { ticker: currentTicker, timeframe }
            },
            id: Date.now()
          })
        });
        
        const result = await response.json();
        if (result?.result?.content?.[0]?.text) {
          const data = JSON.parse(result.result.content[0].text);
          if (data.points && data.points.length > 0) {
            chartPoints = data.points.map(p => ({
              ts: p.ts,
              close: p.close,
              volume: p.volume || 0
            }));
            renderChart();
          }
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        isLoadingChart = false;
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
            const priceChanged = quoteData && quoteData.price !== data.price;
            renderQuote(data, priceChanged);
          }
        }
      } catch (err) {
        console.error('Error refreshing quote:', err);
      }
    }
    
    function startRealTimeUpdates() {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      updateLiveIndicator();
      
      if (isMarketOpen()) {
        refreshInterval = setInterval(() => {
          if (isMarketOpen()) {
            refreshQuote();
          } else {
            updateLiveIndicator();
          }
        }, REFRESH_INTERVAL_MS);
      }
      
      setInterval(updateLiveIndicator, 60000);
    }
    
    function renderQuote(data, flash = false) {
      const previousPrice = quoteData?.price;
      quoteData = data;
      currentTicker = data.ticker;
      
      document.getElementById('ticker').textContent = data.ticker;
      document.getElementById('company-name').textContent = data.name;
      
      // Sector badges
      const badgesEl = document.getElementById('sector-badges');
      badgesEl.innerHTML = '';
      if (data.sector && data.sector !== 'Unknown') {
        badgesEl.innerHTML += '<span class="sector-badge">' + escapeHtml(data.sector) + '</span>';
      }
      if (data.industry && data.industry !== 'Unknown' && data.industry !== data.sector) {
        badgesEl.innerHTML += '<span class="sector-badge">' + escapeHtml(data.industry) + '</span>';
      }
      
      const priceEl = document.getElementById('current-price');
      priceEl.textContent = formatNumber(data.price);
      
      if (flash && previousPrice !== data.price) {
        priceEl.classList.add('price-flash');
        setTimeout(() => priceEl.classList.remove('price-flash'), 300);
      }
      
      const changeEl = document.getElementById('price-change');
      const changeClass = getChangeClass(data.change);
      changeEl.className = 'price-change ' + changeClass;
      document.getElementById('change-value').textContent = (data.change >= 0 ? '+' : '') + formatNumber(data.change);
      document.getElementById('change-percent').textContent = '(' + formatPercent(data.changePercent) + ')';
      
      // Metrics
      document.getElementById('metric-open').textContent = formatNumber(data.open);
      document.getElementById('metric-high').textContent = formatNumber(data.high);
      document.getElementById('metric-low').textContent = formatNumber(data.low);
      document.getElementById('metric-volume').textContent = formatLargeNumber(data.volume);
      document.getElementById('metric-prev-close').textContent = formatNumber(data.prevClose || (data.price - data.change));
      document.getElementById('metric-avg-volume').textContent = formatLargeNumber(data.avgVolume || 0);
      document.getElementById('metric-beta').textContent = data.beta ? formatNumber(data.beta, 2) : 'N/A';
      document.getElementById('metric-market-cap').textContent = formatLargeNumber(data.marketCap);
      document.getElementById('metric-pe').textContent = data.pe > 0 ? formatNumber(data.pe, 1) : 'N/A';
      document.getElementById('metric-eps').textContent = formatNumber(data.eps);
      document.getElementById('metric-yield').textContent = formatNumber(data.dividendYield, 2) + '%';
      
      // 52-week range
      const w52High = data.fiftyTwoWeekHigh || data.high;
      const w52Low = data.fiftyTwoWeekLow || data.low;
      document.getElementById('metric-52w-range').textContent = formatNumber(w52Low, 0) + ' - ' + formatNumber(w52High, 0);
      
      // Range indicators
      updateRangeIndicators(data, w52High, w52Low);
      
      document.getElementById('exchange').textContent = data.exchange || 'UNKNOWN';
      document.getElementById('last-updated').textContent = 'Updated ' + timeAgo(data.lastUpdated);
      
      // Initialize chart with sparkline data
      if (data.sparkline && data.sparkline.length > 0) {
        if (Array.isArray(data.sparkline) && typeof data.sparkline[0] === 'object') {
          chartPoints = data.sparkline;
        } else {
          // Legacy format: just numbers
          chartPoints = data.sparkline.map((close, i) => ({
            ts: new Date(Date.now() - (data.sparkline.length - i) * 60000).toISOString(),
            close,
            volume: 0
          }));
        }
        renderChart();
      }
      
      if (!refreshInterval) {
        startRealTimeUpdates();
      }
      
      requestAnimationFrame(reportHeight);
    }
    
    function updateRangeIndicators(data, w52High, w52Low) {
      const price = data.price;
      
      // Day range
      const dayRange = data.high - data.low;
      if (dayRange > 0) {
        const dayPos = ((price - data.low) / dayRange) * 100;
        document.getElementById('day-range-marker').style.left = dayPos + '%';
        document.getElementById('day-range-fill').style.left = '0%';
        document.getElementById('day-range-fill').style.width = dayPos + '%';
      }
      document.getElementById('day-low').textContent = formatNumber(data.low, 0);
      document.getElementById('day-high').textContent = formatNumber(data.high, 0);
      
      // 52-week range
      const yearRange = w52High - w52Low;
      if (yearRange > 0) {
        const yearPos = ((price - w52Low) / yearRange) * 100;
        document.getElementById('year-range-marker').style.left = yearPos + '%';
        document.getElementById('year-range-fill').style.left = '0%';
        document.getElementById('year-range-fill').style.width = yearPos + '%';
      }
      document.getElementById('year-low').textContent = formatNumber(w52Low, 0);
      document.getElementById('year-high').textContent = formatNumber(w52High, 0);
    }
    
    function renderChart() {
      if (chartPoints.length === 0) return;
      
      const prices = chartPoints.map(p => p.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;
      
      const width = chartWidth - chartPadding.left - chartPadding.right;
      const height = chartHeight - chartPadding.top - chartPadding.bottom;
      const xStep = width / (chartPoints.length - 1);
      
      // Determine color based on first vs last price
      const isPositive = chartPoints[chartPoints.length - 1].close >= chartPoints[0].close;
      const colorClass = isPositive ? 'positive' : 'negative';
      
      let pathD = '';
      let areaD = '';
      
      chartPoints.forEach((p, i) => {
        const x = chartPadding.left + i * xStep;
        const y = chartPadding.top + (1 - (p.close - minPrice) / priceRange) * height;
        
        if (i === 0) {
          pathD += 'M ' + x + ' ' + y;
          areaD += 'M ' + x + ' ' + (chartHeight - chartPadding.bottom) + ' L ' + x + ' ' + y;
        } else {
          pathD += ' L ' + x + ' ' + y;
          areaD += ' L ' + x + ' ' + y;
        }
        
        if (i === chartPoints.length - 1) {
          areaD += ' L ' + x + ' ' + (chartHeight - chartPadding.bottom) + ' Z';
        }
      });
      
      const lineEl = document.getElementById('chart-line');
      const areaEl = document.getElementById('chart-area');
      const dotEl = document.getElementById('chart-dot');
      
      lineEl.setAttribute('d', pathD);
      lineEl.className.baseVal = 'chart-line ' + colorClass;
      
      areaEl.setAttribute('d', areaD);
      areaEl.style.fill = isPositive ? 'url(#chartGradientPositive)' : 'url(#chartGradientNegative)';
      areaEl.className.baseVal = 'chart-area ' + colorClass;
      
      dotEl.className.baseVal = 'chart-dot ' + colorClass;
      
      // Update date range display
      if (chartPoints.length > 0) {
        const firstDate = new Date(chartPoints[0].ts);
        const lastDate = new Date(chartPoints[chartPoints.length - 1].ts);
        const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        document.getElementById('chart-date-range').textContent = formatDate(firstDate) + ' - ' + formatDate(lastDate);
      }
      
      setupChartInteraction(minPrice, maxPrice);
    }
    
    function setupChartInteraction(minPrice, maxPrice) {
      const container = document.getElementById('chart-container');
      const tooltip = document.getElementById('chart-tooltip');
      const crosshairX = document.getElementById('crosshair-x');
      const crosshairY = document.getElementById('crosshair-y');
      const dot = document.getElementById('chart-dot');
      
      const width = chartWidth - chartPadding.left - chartPadding.right;
      const height = chartHeight - chartPadding.top - chartPadding.bottom;
      const priceRange = maxPrice - minPrice || 1;
      
      const handleMove = (clientX, clientY) => {
        const rect = container.getBoundingClientRect();
        const svgRect = document.getElementById('chart-svg').getBoundingClientRect();
        const x = (clientX - svgRect.left) / svgRect.width * chartWidth;
        
        if (x < chartPadding.left || x > chartWidth - chartPadding.right) {
          tooltip.classList.remove('visible');
          crosshairX.classList.remove('visible');
          crosshairY.classList.remove('visible');
          dot.classList.remove('visible');
          return;
        }
        
        const xStep = width / (chartPoints.length - 1);
        const index = Math.round((x - chartPadding.left) / xStep);
        const clampedIndex = Math.max(0, Math.min(chartPoints.length - 1, index));
        const point = chartPoints[clampedIndex];
        
        const px = chartPadding.left + clampedIndex * xStep;
        const py = chartPadding.top + (1 - (point.close - minPrice) / priceRange) * height;
        
        crosshairX.setAttribute('x1', px);
        crosshairX.setAttribute('x2', px);
        crosshairX.classList.add('visible');
        
        crosshairY.setAttribute('y1', py);
        crosshairY.setAttribute('y2', py);
        crosshairY.classList.add('visible');
        
        dot.setAttribute('cx', px);
        dot.setAttribute('cy', py);
        dot.classList.add('visible');
        
        const date = new Date(point.ts);
        const dateStr = currentTimeframe === '1D' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        document.getElementById('tooltip-date').textContent = dateStr;
        document.getElementById('tooltip-price').textContent = formatCurrency(point.close);
        document.getElementById('tooltip-volume').textContent = point.volume > 0 ? 'Vol: ' + formatLargeNumber(point.volume) : '';
        
        // Position tooltip
        const tooltipX = clientX - rect.left;
        const tooltipY = clientY - rect.top;
        
        // Adjust position to keep tooltip in view
        const tooltipWidth = 85;
        const adjustedX = tooltipX + tooltipWidth > rect.width ? tooltipX - tooltipWidth - 10 : tooltipX + 10;
        
        tooltip.style.left = adjustedX + 'px';
        tooltip.style.top = (tooltipY - 40) + 'px';
        tooltip.classList.add('visible');
      };
      
      const handleLeave = () => {
        tooltip.classList.remove('visible');
        crosshairX.classList.remove('visible');
        crosshairY.classList.remove('visible');
        dot.classList.remove('visible');
      };
      
      // Remove old listeners
      container.onmousemove = null;
      container.onmouseleave = null;
      container.ontouchmove = null;
      container.ontouchend = null;
      
      // Add new listeners
      container.onmousemove = (e) => handleMove(e.clientX, e.clientY);
      container.onmouseleave = handleLeave;
      container.ontouchmove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      };
      container.ontouchend = handleLeave;
    }
    
    // Timeframe selector
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isLoadingChart) return;
        
        document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimeframe = btn.getAttribute('data-tf');
        
        fetchChartData(currentTimeframe);
      });
    });
    
    // Action buttons
    document.getElementById('btn-chart').addEventListener('click', () => {
      if (currentTicker) {
        sendMessage('Show me a 1Y chart for ' + currentTicker);
      }
    });
    
    document.getElementById('btn-news').addEventListener('click', () => {
      if (currentTicker) {
        sendMessage('Get the latest news for ' + currentTicker);
      }
    });
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.ticker && !data.points) {
            renderQuote(data);
          }
        } catch (err) {
          console.error('Error parsing quote data:', err);
        }
      }
    });
    
    // Cleanup
    window.addEventListener('beforeunload', () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    });
  </script>
</body>
</html>`;
}
