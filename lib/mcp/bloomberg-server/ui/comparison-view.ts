/**
 * Comparison View - Bloomberg Terminal UI
 * 
 * Displays side-by-side comparison of multiple securities.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getComparisonViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Security Comparison')}
  <style>
    .comparison-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .comparison-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .ticker-badges {
      display: flex;
      gap: var(--space-xs);
    }
    
    .ticker-badge {
      padding: 2px 8px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .comparison-table th {
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
    }
    
    .comparison-table th:first-child {
      width: 100px;
    }
    
    .comparison-table th:not(:first-child) {
      text-align: right;
    }
    
    .comparison-table td {
      padding: var(--space-xs) var(--space-sm);
      border-bottom: 1px solid var(--border-subtle);
      font-size: 11px;
    }
    
    .comparison-table td:not(:first-child) {
      text-align: right;
      font-family: var(--font-mono);
    }
    
    .comparison-table tr:hover {
      background: var(--bg-secondary);
    }
    
    .metric-label {
      font-weight: 500;
      color: var(--text-secondary);
    }
    
    .metric-group {
      background: var(--bg-secondary);
    }
    
    .metric-group td {
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      padding-top: var(--space-sm);
      border-bottom: 1px solid var(--border);
    }
    
    .best-value {
      color: var(--accent-green);
      font-weight: 600;
    }
    
    .worst-value {
      color: var(--accent-red);
    }
    
    .scroll-container {
      max-height: 350px;
      overflow-y: auto;
    }
    
    .comparison-footer {
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
  <div class="card" id="comparison-card">
    <div class="comparison-header">
      <span class="comparison-title">Security Comparison</span>
      <div class="ticker-badges" id="ticker-badges"></div>
    </div>
    
    <div class="scroll-container">
      <table class="comparison-table" id="comparison-table">
        <thead id="table-head">
          <tr>
            <th>Metric</th>
          </tr>
        </thead>
        <tbody id="table-body">
          <tr>
            <td colspan="5" style="text-align: center; padding: var(--space-xl); color: var(--text-muted);">
              Loading comparison data...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="comparison-footer">
      <span id="last-updated">Updated just now</span>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    const metrics = [
      { group: 'Price & Performance' },
      { key: 'price', label: 'Price', format: 'currency' },
      { key: 'changePercent', label: 'Day Change', format: 'percent', higherBetter: true },
      { key: 'marketCap', label: 'Market Cap', format: 'large', higherBetter: true },
      { key: 'volume', label: 'Volume', format: 'large' },
      
      { group: 'Valuation' },
      { key: 'pe', label: 'P/E Ratio', format: 'number', lowerBetter: true },
      { key: 'forwardPe', label: 'Forward P/E', format: 'number', lowerBetter: true },
      { key: 'peg', label: 'PEG Ratio', format: 'number', lowerBetter: true },
      { key: 'priceToBook', label: 'Price/Book', format: 'number', lowerBetter: true },
      { key: 'priceToSales', label: 'Price/Sales', format: 'number', lowerBetter: true },
      
      { group: 'Profitability' },
      { key: 'grossMargin', label: 'Gross Margin', format: 'percent', higherBetter: true },
      { key: 'operatingMargin', label: 'Operating Margin', format: 'percent', higherBetter: true },
      { key: 'netMargin', label: 'Net Margin', format: 'percent', higherBetter: true },
      { key: 'roe', label: 'ROE', format: 'percent', higherBetter: true },
      { key: 'roa', label: 'ROA', format: 'percent', higherBetter: true },
      
      { group: 'Growth' },
      { key: 'revenueGrowth', label: 'Revenue Growth', format: 'percent', higherBetter: true },
      { key: 'epsGrowth', label: 'EPS Growth', format: 'percent', higherBetter: true },
      
      { group: 'Financial Health' },
      { key: 'debtToEquity', label: 'Debt/Equity', format: 'number', lowerBetter: true },
      { key: 'currentRatio', label: 'Current Ratio', format: 'number', higherBetter: true },
      { key: 'quickRatio', label: 'Quick Ratio', format: 'number', higherBetter: true },
      
      { group: 'Dividends' },
      { key: 'dividendYield', label: 'Dividend Yield', format: 'percent', higherBetter: true },
      { key: 'payoutRatio', label: 'Payout Ratio', format: 'percent' }
    ];
    
    function formatValue(value, format) {
      if (value === undefined || value === null || isNaN(value)) return 'N/A';
      
      switch (format) {
        case 'currency': return formatCurrency(value);
        case 'percent': return formatNumber(value, 2) + '%';
        case 'large': return formatLargeNumber(value);
        default: return formatNumber(value, 2);
      }
    }
    
    function findBestWorst(values, higherBetter, lowerBetter) {
      const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
      if (validValues.length < 2) return { best: -1, worst: -1 };
      
      let bestIdx = -1, worstIdx = -1;
      
      if (higherBetter) {
        const max = Math.max(...validValues);
        const min = Math.min(...validValues);
        bestIdx = values.indexOf(max);
        worstIdx = values.indexOf(min);
      } else if (lowerBetter) {
        const max = Math.max(...validValues);
        const min = Math.min(...validValues);
        bestIdx = values.indexOf(min);
        worstIdx = values.indexOf(max);
      }
      
      return { best: bestIdx, worst: worstIdx };
    }
    
    function renderComparison(data) {
      const tickers = data.equities?.map(e => e.ticker) || [];
      const equities = data.equities || [];
      const fundamentals = data.fundamentals || [];
      
      // Render ticker badges
      const badgesEl = document.getElementById('ticker-badges');
      badgesEl.innerHTML = tickers.map(t => '<span class="ticker-badge">' + escapeHtml(t) + '</span>').join('');
      
      // Render table header
      const headEl = document.getElementById('table-head');
      headEl.innerHTML = '<tr><th>Metric</th>' + 
        tickers.map(t => '<th>' + escapeHtml(t) + '</th>').join('') +
        '</tr>';
      
      // Merge equity and fundamental data
      const mergedData = equities.map((eq, i) => ({
        ...eq,
        ...(fundamentals[i] || {})
      }));
      
      // Render table body
      const bodyEl = document.getElementById('table-body');
      let html = '';
      
      metrics.forEach(metric => {
        if (metric.group) {
          html += '<tr class="metric-group"><td colspan="' + (tickers.length + 1) + '">' + escapeHtml(metric.group) + '</td></tr>';
          return;
        }
        
        const values = mergedData.map(d => d[metric.key]);
        const { best, worst } = findBestWorst(values, metric.higherBetter, metric.lowerBetter);
        
        html += '<tr>';
        html += '<td class="metric-label">' + escapeHtml(metric.label) + '</td>';
        
        values.forEach((value, i) => {
          let className = '';
          if (i === best && (metric.higherBetter || metric.lowerBetter)) className = 'best-value';
          else if (i === worst && (metric.higherBetter || metric.lowerBetter)) className = 'worst-value';
          
          html += '<td class="' + className + '">' + formatValue(value, metric.format) + '</td>';
        });
        
        html += '</tr>';
      });
      
      bodyEl.innerHTML = html;
      
      document.getElementById('last-updated').textContent = 'Updated ' + timeAgo(new Date().toISOString());
      
      requestAnimationFrame(reportHeight);
    }
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.equities || data.fundamentals) {
            renderComparison(data);
          }
        } catch (err) {
          console.error('Error parsing comparison data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
