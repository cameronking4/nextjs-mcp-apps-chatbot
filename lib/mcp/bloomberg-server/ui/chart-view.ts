/**
 * Chart View - Bloomberg Terminal UI
 * 
 * Displays an interactive price chart with timeframe selection.
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
    
    .timeframe-selector {
      display: flex;
      gap: 2px;
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
    
    .chart-container {
      padding: var(--space-md);
      height: 220px;
      position: relative;
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
    
    .chart-area {
      fill: var(--accent-blue);
      opacity: 0.1;
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
    
    .chart-tooltip {
      position: absolute;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: var(--space-xs) var(--space-sm);
      font-size: 11px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .chart-tooltip.visible {
      opacity: 1;
    }
    
    .tooltip-date {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    
    .tooltip-price {
      font-weight: 600;
      font-family: var(--font-mono);
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
      padding: 0 var(--space-md) var(--space-md);
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
    }
    
    .stat-value {
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-mono);
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
      opacity: 0.3;
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
      </div>
      <div class="timeframe-selector" id="timeframe-selector">
        <button type="button" class="timeframe-btn" data-tf="1D">1D</button>
        <button type="button" class="timeframe-btn active" data-tf="1W">1W</button>
        <button type="button" class="timeframe-btn" data-tf="1M">1M</button>
        <button type="button" class="timeframe-btn" data-tf="1Y">1Y</button>
      </div>
    </div>
    
    <div class="chart-container" id="chart-container">
      <svg class="chart-svg" id="chart-svg" viewBox="0 0 400 180">
        <!-- Grid lines -->
        <g id="grid-lines"></g>
        <!-- Chart area fill -->
        <path class="chart-area" id="chart-area"></path>
        <!-- Chart line -->
        <path class="chart-line" id="chart-line"></path>
        <!-- Crosshair -->
        <line class="chart-crosshair" id="crosshair-x" x1="0" y1="0" x2="0" y2="180"></line>
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
        <div class="tooltip-price" id="tooltip-price">--</div>
      </div>
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
        <div class="stat-label">Close</div>
        <div class="stat-value" id="stat-close">--</div>
      </div>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let chartData = null;
    let currentTimeframe = '1W';
    const padding = { top: 10, right: 50, bottom: 20, left: 10 };
    const width = 400;
    const height = 180;
    
    function renderChart(data) {
      chartData = data;
      
      document.getElementById('chart-ticker').textContent = data.ticker;
      
      if (data.equity) {
        document.getElementById('chart-price').textContent = formatCurrency(data.equity.price).replace('$', '');
        const changeEl = document.getElementById('chart-change');
        changeEl.textContent = formatPercent(data.equity.changePercent);
        changeEl.className = 'chart-change ' + getChangeClass(data.equity.change);
      }
      
      const points = data.points || [];
      if (points.length === 0) return;
      
      drawLineChart(points);
      updateStats(points);
      
      requestAnimationFrame(reportHeight);
    }
    
    function drawLineChart(points) {
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      
      const prices = points.map(p => p.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice || 1;
      
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
        text.textContent = formatNumber(price, 0);
        yAxisEl.appendChild(text);
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
    
    function setupHoverInteraction(points, minPrice, maxPrice) {
      const container = document.getElementById('chart-container');
      const tooltip = document.getElementById('chart-tooltip');
      const crosshairX = document.getElementById('crosshair-x');
      const crosshairY = document.getElementById('crosshair-y');
      const dot = document.getElementById('chart-dot');
      
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      const priceRange = maxPrice - minPrice || 1;
      
      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const svgRect = document.getElementById('chart-svg').getBoundingClientRect();
        const x = (e.clientX - svgRect.left) / svgRect.width * width;
        
        if (x < padding.left || x > width - padding.right) {
          tooltip.classList.remove('visible');
          crosshairX.classList.remove('visible');
          crosshairY.classList.remove('visible');
          dot.classList.remove('visible');
          return;
        }
        
        const xStep = chartWidth / (points.length - 1);
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
        
        document.getElementById('tooltip-date').textContent = new Date(point.ts).toLocaleDateString();
        document.getElementById('tooltip-price').textContent = formatCurrency(point.close);
        
        tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
        tooltip.classList.add('visible');
      });
      
      container.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
        crosshairX.classList.remove('visible');
        crosshairY.classList.remove('visible');
        dot.classList.remove('visible');
      });
    }
    
    function updateStats(points) {
      if (points.length === 0) return;
      
      const first = points[0];
      const last = points[points.length - 1];
      const high = Math.max(...points.map(p => p.high));
      const low = Math.min(...points.map(p => p.low));
      
      document.getElementById('stat-open').textContent = formatNumber(first.open);
      document.getElementById('stat-high').textContent = formatNumber(high);
      document.getElementById('stat-low').textContent = formatNumber(low);
      document.getElementById('stat-close').textContent = formatNumber(last.close);
    }
    
    // Timeframe selector
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimeframe = btn.getAttribute('data-tf');
        
        if (chartData && chartData.ticker) {
          callTool('equity_historical', { ticker: chartData.ticker, timeframe: currentTimeframe })
            .then(result => {
              if (result?.content?.[0]?.text) {
                const data = JSON.parse(result.content[0].text);
                chartData.points = data.points;
                drawLineChart(data.points);
                updateStats(data.points);
              }
            })
            .catch(err => console.error('Failed to load timeframe:', err));
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
