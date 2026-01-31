/**
 * Watchlist View - Bloomberg Terminal UI
 * 
 * Displays a watchlist table with real-time price updates.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getWatchlistViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Watchlist')}
  <style>
    .watchlist-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .watchlist-title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    
    .watchlist-name {
      font-size: 13px;
      font-weight: 600;
    }
    
    .watchlist-count {
      font-size: 11px;
      color: var(--text-muted);
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
    }
    
    .watchlist-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .watchlist-table th {
      text-align: left;
      padding: var(--space-xs) var(--space-md);
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .watchlist-table th.text-right {
      text-align: right;
    }
    
    .watchlist-table td {
      padding: var(--space-xs) var(--space-md);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 12px;
    }
    
    .watchlist-table tr:hover {
      background: var(--bg-secondary);
    }
    
    .watchlist-table tr:last-child td {
      border-bottom: none;
    }
    
    .ticker-cell {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    
    .ticker-symbol {
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .ticker-name {
      font-size: 10px;
      color: var(--text-muted);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .price-cell {
      font-family: var(--font-mono);
      font-weight: 500;
      text-align: right;
    }
    
    .change-cell {
      font-family: var(--font-mono);
      text-align: right;
      font-size: 11px;
    }
    
    .change-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-weight: 500;
    }
    
    .change-badge.positive {
      background: var(--accent-green-bg);
      color: var(--accent-green);
    }
    
    .change-badge.negative {
      background: var(--accent-red-bg);
      color: var(--accent-red);
    }
    
    .change-badge.neutral {
      background: var(--bg-tertiary);
      color: var(--text-muted);
    }
    
    .volume-cell {
      font-family: var(--font-mono);
      text-align: right;
      color: var(--text-secondary);
      font-size: 11px;
    }
    
    .mini-chart {
      width: 60px;
      height: 20px;
    }
    
    .mini-chart-line {
      fill: none;
      stroke-width: 1.5;
    }
    
    .mini-chart-line.positive { stroke: var(--accent-green); }
    .mini-chart-line.negative { stroke: var(--accent-red); }
    .mini-chart-line.neutral { stroke: var(--text-muted); }
    
    .action-cell {
      text-align: right;
    }
    
    .action-btn {
      padding: 2px 6px;
      font-size: 10px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    
    tr:hover .action-btn {
      opacity: 1;
    }
    
    .empty-state {
      padding: var(--space-xl);
      text-align: center;
      color: var(--text-muted);
    }
    
    .watchlist-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-xs) var(--space-md);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      font-size: 10px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="card" id="watchlist-card">
    <div class="watchlist-header">
      <div class="watchlist-title">
        <span class="watchlist-name" id="watchlist-name">Watchlist</span>
        <span class="watchlist-count" id="watchlist-count">0 items</span>
      </div>
    </div>
    
    <table class="watchlist-table" id="watchlist-table">
      <thead>
        <tr>
          <th>Symbol</th>
          <th class="text-right">Price</th>
          <th class="text-right">Change</th>
          <th class="text-right">Volume</th>
          <th style="width: 70px;">Chart</th>
          <th style="width: 50px;"></th>
        </tr>
      </thead>
      <tbody id="watchlist-body">
        <tr>
          <td colspan="6" class="empty-state">Loading watchlist...</td>
        </tr>
      </tbody>
    </table>
    
    <div class="watchlist-footer">
      <span id="last-updated">Updated just now</span>
      <span id="market-status">Market Open</span>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let watchlistData = null;
    
    function generateMiniChartPath(sparkline, isPositive) {
      if (!sparkline || sparkline.length < 2) return '';
      
      const width = 60;
      const height = 20;
      const padding = 2;
      
      const min = Math.min(...sparkline);
      const max = Math.max(...sparkline);
      const range = max - min || 1;
      
      const xStep = (width - padding * 2) / (sparkline.length - 1);
      
      let pathD = '';
      sparkline.forEach((p, i) => {
        const x = padding + i * xStep;
        const y = height - padding - ((p - min) / range) * (height - padding * 2);
        if (i === 0) {
          pathD += 'M ' + x + ' ' + y;
        } else {
          pathD += ' L ' + x + ' ' + y;
        }
      });
      
      return pathD;
    }
    
    function renderWatchlist(data) {
      watchlistData = data;
      
      const nameEl = document.getElementById('watchlist-name');
      const countEl = document.getElementById('watchlist-count');
      const bodyEl = document.getElementById('watchlist-body');
      
      if (data.watchlist) {
        nameEl.textContent = data.watchlist.name;
      }
      
      const equities = data.equities || [];
      countEl.textContent = equities.length + ' item' + (equities.length !== 1 ? 's' : '');
      
      if (equities.length === 0) {
        bodyEl.innerHTML = '<tr><td colspan="6" class="empty-state">No stocks in watchlist</td></tr>';
        requestAnimationFrame(reportHeight);
        return;
      }
      
      bodyEl.innerHTML = equities.map(eq => {
        const changeClass = getChangeClass(eq.change);
        const sparkline = eq.sparkline || [];
        const chartPath = generateMiniChartPath(sparkline, eq.change >= 0);
        
        return '<tr data-ticker="' + eq.ticker + '">' +
          '<td>' +
            '<div class="ticker-cell">' +
              '<span class="ticker-symbol">' + escapeHtml(eq.ticker) + '</span>' +
              '<span class="ticker-name">' + escapeHtml(eq.name) + '</span>' +
            '</div>' +
          '</td>' +
          '<td class="price-cell">' + formatNumber(eq.price) + '</td>' +
          '<td class="change-cell">' +
            '<span class="change-badge ' + changeClass + '">' +
              formatPercent(eq.changePercent) +
            '</span>' +
          '</td>' +
          '<td class="volume-cell">' + formatLargeNumber(eq.volume) + '</td>' +
          '<td>' +
            '<svg class="mini-chart" viewBox="0 0 60 20">' +
              '<path class="mini-chart-line ' + changeClass + '" d="' + chartPath + '"/>' +
            '</svg>' +
          '</td>' +
          '<td class="action-cell">' +
            '<button type="button" class="btn btn-secondary btn-sm action-btn" data-action="view" data-ticker="' + eq.ticker + '">View</button>' +
          '</td>' +
        '</tr>';
      }).join('');
      
      document.getElementById('last-updated').textContent = 'Updated ' + timeAgo(new Date().toISOString());
      
      // Add click handlers
      bodyEl.querySelectorAll('tr[data-ticker]').forEach(row => {
        row.addEventListener('click', (e) => {
          if (!e.target.closest('.action-btn')) {
            const ticker = row.getAttribute('data-ticker');
            sendMessage('Show me ' + ticker + ' quote and chart');
          }
        });
      });
      
      bodyEl.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const ticker = btn.getAttribute('data-ticker');
          sendMessage('Show me detailed analysis for ' + ticker);
        });
      });
      
      requestAnimationFrame(reportHeight);
    }
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.watchlist || data.equities) {
            renderWatchlist(data);
          }
        } catch (err) {
          console.error('Error parsing watchlist data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
