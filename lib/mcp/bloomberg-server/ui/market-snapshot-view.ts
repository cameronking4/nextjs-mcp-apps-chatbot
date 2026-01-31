/**
 * Market Snapshot View - Bloomberg Terminal UI
 * 
 * Displays market indices, sector performance, and top movers.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getMarketSnapshotViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Market Snapshot')}
  <style>
    .market-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .market-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .market-time {
      font-size: 10px;
      color: var(--text-muted);
    }
    
    .indices-section {
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
    }
    
    .section-title {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-xs);
    }
    
    .indices-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-xs);
    }
    
    .index-card {
      padding: var(--space-xs);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    
    .index-card:hover {
      background: var(--bg-tertiary);
    }
    
    .index-name {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    
    .index-value {
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .index-change {
      font-size: 10px;
      font-family: var(--font-mono);
    }
    
    .sectors-section {
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
    }
    
    .sectors-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .sector-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px var(--space-xs);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    
    .sector-row:hover {
      background: var(--bg-secondary);
    }
    
    .sector-name {
      font-size: 11px;
    }
    
    .sector-change {
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 500;
    }
    
    .sector-bar {
      flex: 1;
      height: 4px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      margin: 0 var(--space-sm);
      overflow: hidden;
    }
    
    .sector-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    
    .sector-bar-fill.positive {
      background: var(--accent-green);
    }
    
    .sector-bar-fill.negative {
      background: var(--accent-red);
    }
    
    .movers-section {
      padding: var(--space-sm) var(--space-md);
    }
    
    .movers-tabs {
      display: flex;
      gap: var(--space-xs);
      margin-bottom: var(--space-sm);
    }
    
    .mover-tab {
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 500;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .mover-tab:hover {
      color: var(--text-primary);
      background: var(--bg-secondary);
    }
    
    .mover-tab.active {
      color: var(--text-primary);
      background: var(--bg-secondary);
    }
    
    .movers-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .mover-row {
      display: grid;
      grid-template-columns: 60px 1fr 70px 60px;
      align-items: center;
      gap: var(--space-xs);
      padding: 4px var(--space-xs);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    
    .mover-row:hover {
      background: var(--bg-secondary);
    }
    
    .mover-ticker {
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .mover-name {
      font-size: 10px;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .mover-price {
      font-size: 11px;
      font-family: var(--font-mono);
      text-align: right;
    }
    
    .mover-change {
      font-size: 10px;
      font-family: var(--font-mono);
      font-weight: 500;
      text-align: right;
    }
    
    .market-footer {
      padding: var(--space-xs) var(--space-md);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card" id="market-card">
    <div class="market-header">
      <span class="market-title">Market Snapshot</span>
      <span class="market-time" id="market-time">--</span>
    </div>
    
    <div class="indices-section">
      <div class="section-title">Major Indices</div>
      <div class="indices-grid" id="indices-grid">
        <!-- Indices will be populated here -->
      </div>
    </div>
    
    <div class="sectors-section">
      <div class="section-title">Sector Performance</div>
      <div class="sectors-list" id="sectors-list">
        <!-- Sectors will be populated here -->
      </div>
    </div>
    
    <div class="movers-section">
      <div class="movers-tabs">
        <button type="button" class="mover-tab active" data-tab="gainers">Top Gainers</button>
        <button type="button" class="mover-tab" data-tab="losers">Top Losers</button>
        <button type="button" class="mover-tab" data-tab="active">Most Active</button>
      </div>
      <div class="movers-list" id="movers-list">
        <!-- Movers will be populated here -->
      </div>
    </div>
    
    <div class="market-footer">
      <span id="last-updated">Updated just now</span>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let marketData = null;
    let currentTab = 'gainers';
    
    function renderIndices(indices) {
      const grid = document.getElementById('indices-grid');
      
      grid.innerHTML = indices.slice(0, 4).map(idx => {
        const changeClass = getChangeClass(idx.change);
        return '<div class="index-card" data-symbol="' + idx.symbol + '">' +
          '<div class="index-name">' + escapeHtml(idx.symbol) + '</div>' +
          '<div class="index-value">' + formatNumber(idx.value, 0) + '</div>' +
          '<div class="index-change ' + changeClass + '">' + formatPercent(idx.changePercent) + '</div>' +
        '</div>';
      }).join('');
      
      grid.querySelectorAll('.index-card').forEach(card => {
        card.addEventListener('click', () => {
          sendMessage('Show me more details about ' + card.getAttribute('data-symbol'));
        });
      });
    }
    
    function renderSectors(sectors) {
      const list = document.getElementById('sectors-list');
      const maxChange = Math.max(...sectors.map(s => Math.abs(s.change)));
      
      list.innerHTML = sectors.slice(0, 6).map(sector => {
        const changeClass = getChangeClass(sector.change);
        const barWidth = (Math.abs(sector.change) / maxChange) * 100;
        
        return '<div class="sector-row" data-sector="' + escapeHtml(sector.name) + '">' +
          '<span class="sector-name">' + escapeHtml(sector.name) + '</span>' +
          '<div class="sector-bar">' +
            '<div class="sector-bar-fill ' + changeClass + '" style="width: ' + barWidth + '%"></div>' +
          '</div>' +
          '<span class="sector-change ' + changeClass + '">' + formatPercent(sector.change) + '</span>' +
        '</div>';
      }).join('');
      
      list.querySelectorAll('.sector-row').forEach(row => {
        row.addEventListener('click', () => {
          sendMessage('Show me stocks in the ' + row.getAttribute('data-sector') + ' sector');
        });
      });
    }
    
    function renderMovers(movers, tab) {
      const list = document.getElementById('movers-list');
      const data = movers[tab] || [];
      
      list.innerHTML = data.slice(0, 5).map(mover => {
        const changeClass = getChangeClass(mover.changePercent);
        return '<div class="mover-row" data-ticker="' + mover.ticker + '">' +
          '<span class="mover-ticker">' + escapeHtml(mover.ticker) + '</span>' +
          '<span class="mover-name">' + escapeHtml(mover.name) + '</span>' +
          '<span class="mover-price">' + formatNumber(mover.price) + '</span>' +
          '<span class="mover-change ' + changeClass + '">' + formatPercent(mover.changePercent) + '</span>' +
        '</div>';
      }).join('');
      
      list.querySelectorAll('.mover-row').forEach(row => {
        row.addEventListener('click', () => {
          sendMessage('Show me ' + row.getAttribute('data-ticker') + ' quote');
        });
      });
    }
    
    function renderMarket(data) {
      marketData = data;
      
      if (data.indices) {
        renderIndices(data.indices);
      }
      
      if (data.sectors) {
        renderSectors(data.sectors);
      }
      
      if (data.movers) {
        renderMovers(data.movers, currentTab);
      }
      
      document.getElementById('market-time').textContent = new Date().toLocaleTimeString();
      document.getElementById('last-updated').textContent = 'Updated ' + timeAgo(data.lastUpdated || new Date().toISOString());
      
      requestAnimationFrame(reportHeight);
    }
    
    // Tab switching
    document.querySelectorAll('.mover-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.mover-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.getAttribute('data-tab');
        
        if (marketData && marketData.movers) {
          renderMovers(marketData.movers, currentTab);
        }
      });
    });
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.indices || data.sectors || data.movers) {
            renderMarket(data);
          }
        } catch (err) {
          console.error('Error parsing market data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
