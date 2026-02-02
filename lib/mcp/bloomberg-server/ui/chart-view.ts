/**
 * Chart View - Bloomberg Terminal UI (Enhanced)
 * 
 * Displays an interactive price chart with:
 * - Multiple timeframes (1D, 1W, 1M, 3M, 6M, 1Y, 5Y, YTD)
 * - Line and candlestick chart types
 * - Volume bars display
 * - Period performance stats
 * - 52-week high/low
 * - Enhanced tooltip with OHLC and volume
 * - X-axis date labels
 */

import { getBaseHead, getBaseScripts } from './base';

export function getChartViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Price Chart')}
  <style>
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
      flex-wrap: wrap;
      gap: var(--space-xs);
    }
    
    .chart-title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    
    .chart-ticker {
      font-size: 14px;
      font-weight: 700;
      font-family: var(--font-mono);
    }
    
    .chart-price {
      font-size: 14px;
      font-family: var(--font-mono);
    }
    
    .chart-change {
      font-size: 12px;
      font-family: var(--font-mono);
    }
    
    .chart-period-change {
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      margin-left: var(--space-xs);
    }
    
    .chart-controls {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    
    .timeframe-selector {
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
    }
    
    .timeframe-btn {
      padding: 4px 8px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 500;
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
    
    .chart-type-toggle {
      display: flex;
      gap: 2px;
      border-left: 1px solid var(--border);
      padding-left: var(--space-sm);
    }
    
    .chart-type-btn {
      padding: 4px 8px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      font-size: 10px;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .chart-type-btn:hover {
      color: var(--text-primary);
      background: var(--bg-tertiary);
    }
    
    .chart-type-btn.active {
      color: var(--accent-blue);
      background: rgba(59, 130, 246, 0.1);
      border-color: var(--accent-blue);
    }
    
    .chart-container {
      padding: var(--space-md);
      height: 200px;
      position: relative;
    }
    
    .volume-container {
      padding: 0 var(--space-md);
      height: 50px;
      position: relative;
      border-top: 1px solid var(--border-subtle);
    }

    /* Fullscreen mode support */
    html.fullscreen,
    html.fullscreen body {
      height: 100%;
    }

    html.fullscreen #chart-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    html.fullscreen .chart-container {
      height: auto;
      flex: 1;
      min-height: 0;
    }
    
    html.fullscreen .volume-container {
      height: 80px;
      flex-shrink: 0;
    }

    html.fullscreen .chart-stats {
      flex-shrink: 0;
    }
    
    .chart-svg {
      width: 100%;
      height: 100%;
    }
    
    .chart-line {
      fill: none;
      stroke: var(--accent-blue);
      stroke-width: 2;
    }
    
    .chart-line.positive {
      stroke: var(--accent-green);
    }
    
    .chart-line.negative {
      stroke: var(--accent-red);
    }
    
    .chart-area {
      fill: var(--accent-blue);
      opacity: 0.08;
    }
    
    .chart-area.positive {
      fill: var(--accent-green);
    }
    
    .chart-area.negative {
      fill: var(--accent-red);
    }
    
    .chart-grid-line {
      stroke: var(--border-subtle);
      stroke-width: 1;
    }
    
    .chart-axis-label {
      font-size: 9px;
      fill: var(--text-muted);
      font-family: var(--font-mono);
    }
    
    .x-axis-label {
      font-size: 8px;
      fill: var(--text-muted);
      font-family: var(--font-mono);
      text-anchor: middle;
    }
    
    .chart-tooltip {
      position: absolute;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: var(--space-sm);
      font-size: 11px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 10;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 140px;
    }
    
    .chart-tooltip.visible {
      opacity: 1;
    }
    
    .tooltip-date {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 6px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 4px;
    }
    
    .tooltip-ohlc {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2px 8px;
      font-family: var(--font-mono);
    }
    
    .tooltip-label {
      color: var(--text-muted);
      font-size: 9px;
    }
    
    .tooltip-value {
      font-weight: 600;
      text-align: right;
    }
    
    .tooltip-volume {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
    }
    
    .chart-crosshair {
      stroke: var(--text-muted);
      stroke-width: 1;
      stroke-dasharray: 3, 3;
      opacity: 0;
    }
    
    .chart-crosshair.visible {
      opacity: 0.5;
    }
    
    .chart-dot {
      fill: var(--accent-blue);
      opacity: 0;
    }
    
    .chart-dot.visible {
      opacity: 1;
    }
    
    .chart-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-xs);
      padding: var(--space-sm) var(--space-md) var(--space-md);
    }
    
    @media (max-width: 400px) {
      .chart-stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .stat-item {
      text-align: center;
      padding: var(--space-xs);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
    }
    
    .stat-label {
      font-size: 9px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .stat-value.positive {
      color: var(--accent-green);
    }
    
    .stat-value.negative {
      color: var(--accent-red);
    }
    
    .candlestick-up {
      fill: var(--accent-green);
      stroke: var(--accent-green);
    }
    
    .candlestick-down {
      fill: var(--accent-red);
      stroke: var(--accent-red);
    }
    
    .volume-bar {
      fill: var(--text-muted);
      opacity: 0.25;
    }
    
    .volume-bar.up {
      fill: var(--accent-green);
      opacity: 0.4;
    }
    
    .volume-bar.down {
      fill: var(--accent-red);
      opacity: 0.4;
    }
    
    .range-indicator {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      padding: 0 var(--space-md) var(--space-sm);
      font-size: 10px;
    }
    
    .range-bar {
      flex: 1;
      height: 4px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      position: relative;
    }
    
    .range-progress {
      position: absolute;
      height: 100%;
      background: var(--accent-blue);
      border-radius: 2px;
    }
    
    .range-marker {
      position: absolute;
      top: -3px;
      width: 2px;
      height: 10px;
      background: var(--text-primary);
      border-radius: 1px;
      transform: translateX(-50%);
    }
    
    .range-label {
      font-family: var(--font-mono);
      color: var(--text-muted);
      white-space: nowrap;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    
    .loading-overlay.visible {
      opacity: 0.8;
      pointer-events: auto;
    }
  </style>
</head>
<body>
  <div class="card" id="chart-card">
    <div class="chart-header">
      <div class="chart-title">
        <span class="chart-ticker" id="chart-ticker">---</span>
        <span class="chart-price" id="chart-price">---.--</span>
        <span class="chart-change" id="chart-change">+0.00%</span>
        <span class="chart-period-change" id="chart-period-change">--</span>
      </div>
      <div class="chart-controls">
        <div class="timeframe-selector" id="timeframe-selector">
          <button type="button" class="timeframe-btn" data-tf="1D">1D</button>
          <button type="button" class="timeframe-btn" data-tf="1W">1W</button>
          <button type="button" class="timeframe-btn active" data-tf="1M">1M</button>
          <button type="button" class="timeframe-btn" data-tf="3M">3M</button>
          <button type="button" class="timeframe-btn" data-tf="6M">6M</button>
          <button type="button" class="timeframe-btn" data-tf="1Y">1Y</button>
          <button type="button" class="timeframe-btn" data-tf="5Y">5Y</button>
          <button type="button" class="timeframe-btn" data-tf="YTD">YTD</button>
        </div>
        <div class="chart-type-toggle">
          <button type="button" class="chart-type-btn active" data-type="line" title="Line Chart">Line</button>
          <button type="button" class="chart-type-btn" data-type="candlestick" title="Candlestick">Candle</button>
        </div>
      </div>
    </div>
    
    <div class="chart-container" id="chart-container">
      <svg class="chart-svg" id="chart-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
        <!-- Grid lines -->
        <g id="grid-lines"></g>
        <!-- Chart area fill -->
        <path class="chart-area" id="chart-area"></path>
        <!-- Candlesticks (hidden by default) -->
        <g id="candlesticks"></g>
        <!-- Chart line -->
        <path class="chart-line" id="chart-line"></path>
        <!-- Crosshair -->
        <line class="chart-crosshair" id="crosshair-x" x1="0" y1="0" x2="0" y2="160"></line>
        <line class="chart-crosshair" id="crosshair-y" x1="0" y1="0" x2="400" y2="0"></line>
        <!-- Hover dot -->
        <circle class="chart-dot" id="chart-dot" r="4" cx="0" cy="0"></circle>
        <!-- Y axis labels -->
        <g id="y-axis"></g>
        <!-- X axis labels -->
        <g id="x-axis"></g>
      </svg>
      <div class="chart-tooltip" id="chart-tooltip">
        <div class="tooltip-date" id="tooltip-date">--</div>
        <div class="tooltip-ohlc">
          <span class="tooltip-label">O</span>
          <span class="tooltip-value" id="tooltip-open">--</span>
          <span class="tooltip-label">H</span>
          <span class="tooltip-value" id="tooltip-high">--</span>
          <span class="tooltip-label">L</span>
          <span class="tooltip-value" id="tooltip-low">--</span>
          <span class="tooltip-label">C</span>
          <span class="tooltip-value" id="tooltip-close">--</span>
        </div>
        <div class="tooltip-volume">
          <span class="tooltip-label">Vol</span>
          <span class="tooltip-value" id="tooltip-volume">--</span>
        </div>
      </div>
      <div class="loading-overlay" id="loading-overlay">
        <span style="color: var(--text-muted)">Loading...</span>
      </div>
    </div>
    
    <div class="volume-container" id="volume-container">
      <svg class="chart-svg" id="volume-svg" viewBox="0 0 400 40" preserveAspectRatio="none">
        <g id="volume-bars"></g>
      </svg>
    </div>
    
    <div class="range-indicator" id="range-52week">
      <span class="range-label" id="range-low">--</span>
      <div class="range-bar">
        <div class="range-progress" id="range-progress"></div>
        <div class="range-marker" id="range-marker"></div>
      </div>
      <span class="range-label" id="range-high">--</span>
    </div>
    
    <div class="chart-stats" id="chart-stats">
      <div class="stat-item">
        <div class="stat-label">Open</div>
        <div class="stat-value" id="stat-open">--</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">High</div>
        <div class="stat-value" id="stat-high">--</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Low</div>
        <div class="stat-value" id="stat-low">--</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Vol</div>
        <div class="stat-value" id="stat-volume">--</div>
      </div>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let chartData = null;
    let currentTimeframe = '1M';
    let currentChartType = 'line';
    const padding = { top: 10, right: 50, bottom: 20, left: 10 };
    const width = 400;
    const height = 160;
    const volumeHeight = 40;
    
    function formatVolume(vol) {
      if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
      if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
      if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
      return vol.toFixed(0);
    }
    
    function formatDateForTimeframe(date, tf) {
      const d = new Date(date);
      if (tf === '1D') {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (tf === '1W') {
        return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
      } else if (tf === '5Y') {
        return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
      } else {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }
    
    function showLoading() {
      document.getElementById('loading-overlay').classList.add('visible');
    }
    
    function hideLoading() {
      document.getElementById('loading-overlay').classList.remove('visible');
    }
    
    function renderChart(data) {
      chartData = data;
      hideLoading();
      
      document.getElementById('chart-ticker').textContent = data.ticker;
      
      if (data.equity) {
        document.getElementById('chart-price').textContent = formatCurrency(data.equity.price).replace('$', '');
        const changeEl = document.getElementById('chart-change');
        changeEl.textContent = formatPercent(data.equity.changePercent);
        changeEl.className = 'chart-change ' + getChangeClass(data.equity.change);
      }
      
      // Period change display
      const periodChangeEl = document.getElementById('chart-period-change');
      if (data.periodStats) {
        const pct = data.periodStats.changePercent;
        periodChangeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '% (' + data.timeframe + ')';
        periodChangeEl.className = 'chart-period-change ' + getChangeClass(pct);
      }
      
      const points = data.points || [];
      if (points.length === 0) return;
      
      // Update timeframe button
      document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tf') === data.timeframe);
      });
      currentTimeframe = data.timeframe;
      
      // Update chart type button if provided
      if (data.chartType) {
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-type') === data.chartType);
        });
        currentChartType = data.chartType;
      }
      
      drawChart(points);
      drawVolumeBars(points);
      updateStats(data);
      update52WeekRange(data);
      
      requestAnimationFrame(reportHeight);
    }
    
    function drawChart(points) {
      if (currentChartType === 'candlestick') {
        drawCandlestickChart(points);
      } else {
        drawLineChart(points);
      }
    }
    
    function drawLineChart(points) {
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      
      const prices = points.map(p => p.close);
      const minPrice = Math.min(...prices, ...points.map(p => p.low));
      const maxPrice = Math.max(...prices, ...points.map(p => p.high));
      const priceRange = maxPrice - minPrice || 1;
      
      // Determine trend direction
      const isPositive = points[points.length - 1].close >= points[0].close;
      
      // Hide candlesticks, show line
      document.getElementById('candlesticks').innerHTML = '';
      document.getElementById('chart-line').style.display = 'block';
      document.getElementById('chart-area').style.display = 'block';
      
      // Update line/area colors based on trend
      const chartLine = document.getElementById('chart-line');
      const chartArea = document.getElementById('chart-area');
      chartLine.className = 'chart-line ' + (isPositive ? 'positive' : 'negative');
      chartArea.className = 'chart-area ' + (isPositive ? 'positive' : 'negative');
      
      // Draw grid
      const gridEl = document.getElementById('grid-lines');
      gridEl.innerHTML = '';
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'chart-grid-line');
        line.setAttribute('x1', padding.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - padding.right);
        line.setAttribute('y2', y);
        gridEl.appendChild(line);
      }
      
      // Draw Y axis labels
      const yAxisEl = document.getElementById('y-axis');
      yAxisEl.innerHTML = '';
      for (let i = 0; i <= 4; i++) {
        const price = maxPrice - (priceRange / 4) * i;
        const y = padding.top + (chartHeight / 4) * i;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'chart-axis-label');
        text.setAttribute('x', width - padding.right + 5);
        text.setAttribute('y', y + 3);
        text.textContent = formatNumber(price, price < 10 ? 2 : 0);
        yAxisEl.appendChild(text);
      }
      
      // Draw X axis labels
      const xAxisEl = document.getElementById('x-axis');
      xAxisEl.innerHTML = '';
      const labelCount = Math.min(5, points.length);
      const labelStep = Math.floor(points.length / labelCount);
      for (let i = 0; i < labelCount; i++) {
        const idx = Math.min(i * labelStep, points.length - 1);
        const point = points[idx];
        const x = padding.left + (idx / (points.length - 1)) * chartWidth;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'x-axis-label');
        text.setAttribute('x', x);
        text.setAttribute('y', height - 2);
        text.textContent = formatDateForTimeframe(point.ts, currentTimeframe);
        xAxisEl.appendChild(text);
      }
      
      // Draw line path
      const xStep = chartWidth / (points.length - 1);
      let pathD = '';
      let areaD = '';
      
      points.forEach((p, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + (1 - (p.close - minPrice) / priceRange) * chartHeight;
        
        if (i === 0) {
          pathD += 'M ' + x + ' ' + y;
          areaD += 'M ' + x + ' ' + (height - padding.bottom) + ' L ' + x + ' ' + y;
        } else {
          pathD += ' L ' + x + ' ' + y;
          areaD += ' L ' + x + ' ' + y;
        }
        
        if (i === points.length - 1) {
          areaD += ' L ' + x + ' ' + (height - padding.bottom) + ' Z';
        }
      });
      
      document.getElementById('chart-line').setAttribute('d', pathD);
      document.getElementById('chart-area').setAttribute('d', areaD);
      
      // Setup hover interaction
      setupHoverInteraction(points, minPrice, maxPrice);
    }
    
    function drawCandlestickChart(points) {
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      
      const allPrices = points.flatMap(p => [p.open, p.high, p.low, p.close]);
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const priceRange = maxPrice - minPrice || 1;
      
      // Hide line, show candlesticks
      document.getElementById('chart-line').style.display = 'none';
      document.getElementById('chart-area').style.display = 'none';
      
      // Draw grid
      const gridEl = document.getElementById('grid-lines');
      gridEl.innerHTML = '';
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'chart-grid-line');
        line.setAttribute('x1', padding.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - padding.right);
        line.setAttribute('y2', y);
        gridEl.appendChild(line);
      }
      
      // Draw Y axis labels
      const yAxisEl = document.getElementById('y-axis');
      yAxisEl.innerHTML = '';
      for (let i = 0; i <= 4; i++) {
        const price = maxPrice - (priceRange / 4) * i;
        const y = padding.top + (chartHeight / 4) * i;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'chart-axis-label');
        text.setAttribute('x', width - padding.right + 5);
        text.setAttribute('y', y + 3);
        text.textContent = formatNumber(price, price < 10 ? 2 : 0);
        yAxisEl.appendChild(text);
      }
      
      // Draw X axis labels
      const xAxisEl = document.getElementById('x-axis');
      xAxisEl.innerHTML = '';
      const labelCount = Math.min(5, points.length);
      const labelStep = Math.floor(points.length / labelCount);
      for (let i = 0; i < labelCount; i++) {
        const idx = Math.min(i * labelStep, points.length - 1);
        const point = points[idx];
        const x = padding.left + (idx / (points.length - 1)) * chartWidth;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'x-axis-label');
        text.setAttribute('x', x);
        text.setAttribute('y', height - 2);
        text.textContent = formatDateForTimeframe(point.ts, currentTimeframe);
        xAxisEl.appendChild(text);
      }
      
      // Draw candlesticks
      const candlesticksEl = document.getElementById('candlesticks');
      candlesticksEl.innerHTML = '';
      
      const candleWidth = Math.max(2, (chartWidth / points.length) * 0.7);
      const xStep = chartWidth / points.length;
      
      points.forEach((p, i) => {
        const x = padding.left + i * xStep + xStep / 2;
        const isUp = p.close >= p.open;
        
        const highY = padding.top + (1 - (p.high - minPrice) / priceRange) * chartHeight;
        const lowY = padding.top + (1 - (p.low - minPrice) / priceRange) * chartHeight;
        const openY = padding.top + (1 - (p.open - minPrice) / priceRange) * chartHeight;
        const closeY = padding.top + (1 - (p.close - minPrice) / priceRange) * chartHeight;
        
        // Wick
        const wick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        wick.setAttribute('x1', x);
        wick.setAttribute('y1', highY);
        wick.setAttribute('x2', x);
        wick.setAttribute('y2', lowY);
        wick.setAttribute('stroke', isUp ? 'var(--accent-green)' : 'var(--accent-red)');
        wick.setAttribute('stroke-width', '1');
        candlesticksEl.appendChild(wick);
        
        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', x - candleWidth / 2);
        body.setAttribute('y', Math.min(openY, closeY));
        body.setAttribute('width', candleWidth);
        body.setAttribute('height', Math.max(1, Math.abs(closeY - openY)));
        body.setAttribute('fill', isUp ? 'var(--accent-green)' : 'var(--accent-red)');
        body.setAttribute('class', isUp ? 'candlestick-up' : 'candlestick-down');
        candlesticksEl.appendChild(body);
      });
      
      // Setup hover interaction
      setupHoverInteraction(points, minPrice, maxPrice);
    }
    
    function drawVolumeBars(points) {
      const chartWidth = width - padding.left - padding.right;
      const volumeBarsEl = document.getElementById('volume-bars');
      volumeBarsEl.innerHTML = '';
      
      const volumes = points.map(p => p.volume);
      const maxVolume = Math.max(...volumes) || 1;
      
      const barWidth = Math.max(1, (chartWidth / points.length) * 0.8);
      const xStep = chartWidth / points.length;
      const vPadding = 4;
      
      points.forEach((p, i) => {
        const x = padding.left + i * xStep + (xStep - barWidth) / 2;
        const barHeight = (p.volume / maxVolume) * (volumeHeight - vPadding * 2);
        const y = volumeHeight - vPadding - barHeight;
        
        const isUp = p.close >= p.open;
        
        const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bar.setAttribute('x', x);
        bar.setAttribute('y', y);
        bar.setAttribute('width', barWidth);
        bar.setAttribute('height', barHeight);
        bar.setAttribute('class', 'volume-bar ' + (isUp ? 'up' : 'down'));
        volumeBarsEl.appendChild(bar);
      });
    }
    
    function setupHoverInteraction(points, minPrice, maxPrice) {
      const container = document.getElementById('chart-container');
      const tooltip = document.getElementById('chart-tooltip');
      const crosshairX = document.getElementById('crosshair-x');
      const crosshairY = document.getElementById('crosshair-y');
      const dot = document.getElementById('chart-dot');
      
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const priceRange = maxPrice - minPrice || 1;
      
      // Remove old listeners
      const newContainer = container.cloneNode(true);
      container.parentNode.replaceChild(newContainer, container);
      
      newContainer.querySelector('#chart-tooltip').id = 'chart-tooltip';
      
      const newTooltip = newContainer.querySelector('.chart-tooltip');
      const svg = newContainer.querySelector('#chart-svg');
      
      newContainer.addEventListener('mousemove', (e) => {
        const svgRect = svg.getBoundingClientRect();
        const x = (e.clientX - svgRect.left) / svgRect.width * width;
        
        if (x < padding.left || x > width - padding.right) {
          hideTooltip();
          return;
        }
        
        const xStep = chartWidth / (points.length - 1 || 1);
        const index = Math.round((x - padding.left) / xStep);
        const clampedIndex = Math.max(0, Math.min(points.length - 1, index));
        const point = points[clampedIndex];
        
        const px = padding.left + clampedIndex * xStep;
        const py = padding.top + (1 - (point.close - minPrice) / priceRange) * chartHeight;
        
        crosshairX.setAttribute('x1', px);
        crosshairX.setAttribute('x2', px);
        crosshairX.classList.add('visible');
        
        crosshairY.setAttribute('y1', py);
        crosshairY.setAttribute('y2', py);
        crosshairY.classList.add('visible');
        
        dot.setAttribute('cx', px);
        dot.setAttribute('cy', py);
        dot.classList.add('visible');
        
        // Update tooltip content
        const dateStr = formatDateForTimeframe(point.ts, currentTimeframe);
        newTooltip.querySelector('#tooltip-date').textContent = dateStr;
        newTooltip.querySelector('#tooltip-open').textContent = formatNumber(point.open);
        newTooltip.querySelector('#tooltip-high').textContent = formatNumber(point.high);
        newTooltip.querySelector('#tooltip-low').textContent = formatNumber(point.low);
        newTooltip.querySelector('#tooltip-close').textContent = formatNumber(point.close);
        newTooltip.querySelector('#tooltip-volume').textContent = formatVolume(point.volume);
        
        // Position tooltip
        const containerRect = newContainer.getBoundingClientRect();
        let left = e.clientX - containerRect.left + 15;
        let top = e.clientY - containerRect.top - 10;
        
        // Keep tooltip in view
        if (left + 150 > containerRect.width) {
          left = e.clientX - containerRect.left - 160;
        }
        
        newTooltip.style.left = left + 'px';
        newTooltip.style.top = top + 'px';
        newTooltip.classList.add('visible');
      });
      
      newContainer.addEventListener('mouseleave', hideTooltip);
      
      function hideTooltip() {
        newTooltip.classList.remove('visible');
        crosshairX.classList.remove('visible');
        crosshairY.classList.remove('visible');
        dot.classList.remove('visible');
      }
    }
    
    function updateStats(data) {
      const points = data.points || [];
      if (points.length === 0) return;
      
      const first = points[0];
      const last = points[points.length - 1];
      const periodHigh = data.periodStats?.high || Math.max(...points.map(p => p.high));
      const periodLow = data.periodStats?.low || Math.min(...points.map(p => p.low));
      const avgVolume = data.periodStats?.avgVolume || (points.reduce((sum, p) => sum + p.volume, 0) / points.length);
      
      document.getElementById('stat-open').textContent = formatNumber(first.open);
      document.getElementById('stat-high').textContent = formatNumber(periodHigh);
      document.getElementById('stat-low').textContent = formatNumber(periodLow);
      document.getElementById('stat-volume').textContent = formatVolume(avgVolume);
    }
    
    function update52WeekRange(data) {
      const rangeEl = document.getElementById('range-52week');
      const range = data.range52Week;
      const equity = data.equity;
      
      if (!range || !equity || !range.high || !range.low) {
        rangeEl.style.display = 'none';
        return;
      }
      
      rangeEl.style.display = 'flex';
      
      const currentPrice = equity.price;
      const low52 = range.low;
      const high52 = range.high;
      const rangeWidth = high52 - low52;
      
      document.getElementById('range-low').textContent = formatNumber(low52);
      document.getElementById('range-high').textContent = formatNumber(high52);
      
      // Calculate position of current price in range
      const position = rangeWidth > 0 ? ((currentPrice - low52) / rangeWidth) * 100 : 50;
      const clampedPosition = Math.max(0, Math.min(100, position));
      
      document.getElementById('range-progress').style.width = clampedPosition + '%';
      document.getElementById('range-marker').style.left = clampedPosition + '%';
    }
    
    // Timeframe selector
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        
        document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimeframe = btn.getAttribute('data-tf');
        
        if (chartData && chartData.ticker) {
          showLoading();
          callTool('equity_historical', { 
            ticker: chartData.ticker, 
            timeframe: currentTimeframe,
            chartType: currentChartType 
          })
            .then(result => {
              if (result?.content?.[0]?.text) {
                const data = JSON.parse(result.content[0].text);
                renderChart(data);
              }
            })
            .catch(err => {
              console.error('Failed to load timeframe:', err);
              hideLoading();
            });
        }
      });
    });
    
    // Chart type toggle
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        
        document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentChartType = btn.getAttribute('data-type');
        
        if (chartData && chartData.points) {
          drawChart(chartData.points);
        }
      });
    });
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.ticker && data.points) {
            renderChart(data);
          }
        } catch (err) {
          console.error('Error parsing chart data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
