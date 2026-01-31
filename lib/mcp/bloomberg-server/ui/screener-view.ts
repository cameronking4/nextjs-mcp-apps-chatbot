/**
 * Screener View - Bloomberg Terminal UI
 * 
 * Displays stock screening results with filter indicators.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getScreenerViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Stock Screener')}
  <style>
    .screener-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .screener-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .result-count {
      font-size: 11px;
      color: var(--text-muted);
    }
    
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs);
      padding: var(--space-sm) var(--space-md);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
    }
    
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: var(--accent-blue-bg);
      color: var(--accent-blue);
      border-radius: var(--radius-sm);
      font-size: 10px;
      font-weight: 500;
    }
    
    .filter-chip-label {
      color: var(--text-muted);
    }
    
    .results-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .results-table th {
      text-align: left;
      padding: var(--space-xs) var(--space-sm);
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
      position: sticky;
      top: 0;
      cursor: pointer;
    }
    
    .results-table th:hover {
      color: var(--text-primary);
    }
    
    .results-table th.text-right {
      text-align: right;
    }
    
    .results-table th .sort-icon {
      margin-left: 2px;
      opacity: 0.5;
    }
    
    .results-table th.sorted .sort-icon {
      opacity: 1;
    }
    
    .results-table td {
      padding: var(--space-xs) var(--space-sm);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 11px;
    }
    
    .results-table tr:hover {
      background: var(--bg-secondary);
      cursor: pointer;
    }
    
    .results-table tr:last-child td {
      border-bottom: none;
    }
    
    .ticker-col {
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .name-col {
      color: var(--text-secondary);
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .num-col {
      text-align: right;
      font-family: var(--font-mono);
    }
    
    .sector-col {
      font-size: 10px;
      color: var(--text-muted);
    }
    
    .scroll-container {
      max-height: 280px;
      overflow-y: auto;
    }
    
    .empty-state {
      padding: var(--space-xl);
      text-align: center;
      color: var(--text-muted);
    }
    
    .screener-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
    }
    
    .footer-actions {
      display: flex;
      gap: var(--space-xs);
    }
  </style>
</head>
<body>
  <div class="card" id="screener-card">
    <div class="screener-header">
      <span class="screener-title">Screener Results</span>
      <span class="result-count" id="result-count">-- matches</span>
    </div>
    
    <div class="filter-bar" id="filter-bar" style="display: none;"></div>
    
    <div class="scroll-container">
      <table class="results-table" id="results-table">
        <thead>
          <tr>
            <th data-sort="ticker">Ticker <span class="sort-icon">↕</span></th>
            <th data-sort="name">Name</th>
            <th data-sort="price" class="text-right">Price <span class="sort-icon">↕</span></th>
            <th data-sort="changePercent" class="text-right">Chg% <span class="sort-icon">↕</span></th>
            <th data-sort="marketCap" class="text-right">Mkt Cap <span class="sort-icon">↕</span></th>
            <th data-sort="pe" class="text-right">P/E <span class="sort-icon">↕</span></th>
            <th data-sort="dividendYield" class="text-right">Yield <span class="sort-icon">↕</span></th>
          </tr>
        </thead>
        <tbody id="results-body">
          <tr>
            <td colspan="7" class="empty-state">Loading results...</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="screener-footer">
      <span class="text-xs text-muted" id="last-updated">Updated just now</span>
      <div class="footer-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="save-watchlist-btn">Save as Watchlist</button>
      </div>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let screenerData = null;
    let currentSort = { field: 'marketCap', direction: 'desc' };
    
    function renderFilters(filters) {
      const filterBar = document.getElementById('filter-bar');
      
      if (!filters || Object.keys(filters).length === 0) {
        filterBar.style.display = 'none';
        return;
      }
      
      const filterChips = [];
      
      if (filters.sector) {
        filterChips.push('<span class="filter-chip"><span class="filter-chip-label">Sector:</span> ' + escapeHtml(filters.sector) + '</span>');
      }
      if (filters.minMarketCap) {
        filterChips.push('<span class="filter-chip"><span class="filter-chip-label">Min Cap:</span> $' + formatLargeNumber(filters.minMarketCap) + '</span>');
      }
      if (filters.maxMarketCap) {
        filterChips.push('<span class="filter-chip"><span class="filter-chip-label">Max Cap:</span> $' + formatLargeNumber(filters.maxMarketCap) + '</span>');
      }
      if (filters.minPe) {
        filterChips.push('<span class="filter-chip"><span class="filter-chip-label">Min P/E:</span> ' + filters.minPe + '</span>');
      }
      if (filters.maxPe) {
        filterChips.push('<span class="filter-chip"><span class="filter-chip-label">Max P/E:</span> ' + filters.maxPe + '</span>');
      }
      if (filters.minDividendYield) {
        filterChips.push('<span class="filter-chip"><span class="filter-chip-label">Min Yield:</span> ' + filters.minDividendYield + '%</span>');
      }
      
      if (filterChips.length > 0) {
        filterBar.innerHTML = filterChips.join('');
        filterBar.style.display = 'flex';
      } else {
        filterBar.style.display = 'none';
      }
    }
    
    function sortResults(results, field, direction) {
      return [...results].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    function renderResults(results) {
      const bodyEl = document.getElementById('results-body');
      const countEl = document.getElementById('result-count');
      
      countEl.textContent = results.length + ' match' + (results.length !== 1 ? 'es' : '');
      
      if (results.length === 0) {
        bodyEl.innerHTML = '<tr><td colspan="7" class="empty-state">No stocks match your criteria</td></tr>';
        return;
      }
      
      const sorted = sortResults(results, currentSort.field, currentSort.direction);
      
      bodyEl.innerHTML = sorted.map(eq => {
        const changeClass = getChangeClass(eq.changePercent);
        return '<tr data-ticker="' + eq.ticker + '">' +
          '<td class="ticker-col">' + escapeHtml(eq.ticker) + '</td>' +
          '<td class="name-col">' + escapeHtml(eq.name) + '</td>' +
          '<td class="num-col">' + formatNumber(eq.price) + '</td>' +
          '<td class="num-col ' + changeClass + '">' + formatPercent(eq.changePercent) + '</td>' +
          '<td class="num-col">' + formatLargeNumber(eq.marketCap) + '</td>' +
          '<td class="num-col">' + (eq.pe > 0 ? formatNumber(eq.pe, 1) : 'N/A') + '</td>' +
          '<td class="num-col">' + formatNumber(eq.dividendYield, 2) + '%</td>' +
        '</tr>';
      }).join('');
      
      // Add click handlers
      bodyEl.querySelectorAll('tr[data-ticker]').forEach(row => {
        row.addEventListener('click', () => {
          const ticker = row.getAttribute('data-ticker');
          sendMessage('Show me ' + ticker + ' quote and fundamentals');
        });
      });
    }
    
    function renderScreener(data) {
      screenerData = data;
      
      renderFilters(data.filters);
      renderResults(data.results || []);
      
      document.getElementById('last-updated').textContent = 'Updated ' + timeAgo(new Date().toISOString());
      
      requestAnimationFrame(reportHeight);
    }
    
    // Column sorting
    document.querySelectorAll('.results-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        
        if (currentSort.field === field) {
          currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.field = field;
          currentSort.direction = 'desc';
        }
        
        document.querySelectorAll('.results-table th').forEach(h => h.classList.remove('sorted'));
        th.classList.add('sorted');
        
        if (screenerData && screenerData.results) {
          renderResults(screenerData.results);
        }
      });
    });
    
    // Save as watchlist
    document.getElementById('save-watchlist-btn').addEventListener('click', () => {
      if (screenerData && screenerData.results && screenerData.results.length > 0) {
        const tickers = screenerData.results.map(r => r.ticker).join(', ');
        sendMessage('Create a watchlist called "Screener Results" with ' + tickers);
      }
    });
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.results || data.filters) {
            renderScreener(data);
          }
        } catch (err) {
          console.error('Error parsing screener data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
