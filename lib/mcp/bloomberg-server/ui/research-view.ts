/**
 * Research View - Bloomberg Terminal UI
 * 
 * Displays company research summary with key metrics and news.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getResearchViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Company Research')}
  <style>
    .research-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .company-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .company-ticker {
      font-size: 18px;
      font-weight: 700;
      font-family: var(--font-mono);
    }
    
    .company-name {
      font-size: 12px;
      color: var(--text-muted);
    }
    
    .company-sector {
      font-size: 10px;
      color: var(--text-muted);
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
      display: inline-block;
      margin-top: 4px;
    }
    
    .price-summary {
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
    
    .research-tabs {
      display: flex;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .tab-btn {
      padding: var(--space-sm) var(--space-md);
      font-size: 11px;
      font-weight: 500;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .tab-btn:hover {
      color: var(--text-primary);
    }
    
    .tab-btn.active {
      color: var(--text-primary);
      border-bottom-color: var(--accent-blue);
    }
    
    .tab-content {
      display: none;
      padding: var(--space-md);
    }
    
    .tab-content.active {
      display: block;
    }
    
    .metrics-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-sm);
      margin-bottom: var(--space-md);
    }
    
    .metric-card {
      padding: var(--space-sm);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
    }
    
    .metric-label {
      font-size: 9px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    
    .metric-value {
      font-size: 14px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    
    .metric-value.positive { color: var(--accent-green); }
    .metric-value.negative { color: var(--accent-red); }
    
    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-sm);
      padding-bottom: var(--space-xs);
      border-bottom: 1px solid var(--border);
    }
    
    .fundamentals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-xs);
    }
    
    .fundamental-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 11px;
      border-bottom: 1px solid var(--border-subtle);
    }
    
    .fundamental-label {
      color: var(--text-muted);
    }
    
    .fundamental-value {
      font-family: var(--font-mono);
      font-weight: 500;
    }
    
    .news-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }
    
    .news-item {
      padding: var(--space-sm);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    
    .news-item:hover {
      background: var(--bg-tertiary);
    }
    
    .news-headline {
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .news-meta {
      display: flex;
      gap: var(--space-sm);
      font-size: 10px;
      color: var(--text-muted);
    }
    
    .earnings-card {
      padding: var(--space-sm);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--accent-blue);
    }
    
    .earnings-title {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .earnings-date {
      font-size: 10px;
      color: var(--text-muted);
    }
    
    .earnings-estimate {
      font-size: 12px;
      font-family: var(--font-mono);
      margin-top: 4px;
    }
    
    .scroll-container {
      max-height: 250px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="card" id="research-card">
    <div class="research-header">
      <div class="company-info">
        <span class="company-ticker" id="company-ticker">---</span>
        <span class="company-name" id="company-name">Loading...</span>
        <span class="company-sector" id="company-sector">--</span>
      </div>
      <div class="price-summary">
        <div class="current-price" id="current-price">---.--</div>
        <div class="price-change" id="price-change">+0.00 (+0.00%)</div>
      </div>
    </div>
    
    <div class="research-tabs">
      <button type="button" class="tab-btn active" data-tab="overview">Overview</button>
      <button type="button" class="tab-btn" data-tab="fundamentals">Fundamentals</button>
      <button type="button" class="tab-btn" data-tab="news">News</button>
    </div>
    
    <div class="tab-content active" id="tab-overview">
      <div class="metrics-section" id="key-metrics"></div>
      
      <div class="section-title">Upcoming Events</div>
      <div id="upcoming-events">
        <div class="earnings-card" id="earnings-card" style="display: none;">
          <div class="earnings-title">Earnings Report</div>
          <div class="earnings-date" id="earnings-date">--</div>
          <div class="earnings-estimate" id="earnings-estimate">Est. EPS: --</div>
        </div>
      </div>
    </div>
    
    <div class="tab-content" id="tab-fundamentals">
      <div class="scroll-container">
        <div class="section-title">Valuation</div>
        <div class="fundamentals-grid" id="valuation-metrics"></div>
        
        <div class="section-title" style="margin-top: var(--space-md);">Profitability</div>
        <div class="fundamentals-grid" id="profitability-metrics"></div>
        
        <div class="section-title" style="margin-top: var(--space-md);">Financial Health</div>
        <div class="fundamentals-grid" id="health-metrics"></div>
      </div>
    </div>
    
    <div class="tab-content" id="tab-news">
      <div class="scroll-container">
        <div class="news-list" id="news-list">
          <div style="text-align: center; padding: var(--space-md); color: var(--text-muted);">
            No recent news
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    function renderMetric(label, value, format, changeClass) {
      let formattedValue = value;
      if (format === 'currency') formattedValue = formatCurrency(value);
      else if (format === 'percent') formattedValue = formatNumber(value, 2) + '%';
      else if (format === 'large') formattedValue = formatLargeNumber(value);
      else if (format === 'number') formattedValue = formatNumber(value, 2);
      
      return '<div class="metric-card">' +
        '<div class="metric-label">' + escapeHtml(label) + '</div>' +
        '<div class="metric-value' + (changeClass ? ' ' + changeClass : '') + '">' + formattedValue + '</div>' +
      '</div>';
    }
    
    function renderFundamentalRow(label, value, format) {
      let formattedValue = value;
      if (value === null || value === undefined || isNaN(value)) formattedValue = 'N/A';
      else if (format === 'currency') formattedValue = formatCurrency(value);
      else if (format === 'percent') formattedValue = formatNumber(value, 2) + '%';
      else if (format === 'large') formattedValue = formatLargeNumber(value);
      else formattedValue = formatNumber(value, 2);
      
      return '<div class="fundamental-row">' +
        '<span class="fundamental-label">' + escapeHtml(label) + '</span>' +
        '<span class="fundamental-value">' + formattedValue + '</span>' +
      '</div>';
    }
    
    function renderResearch(data) {
      const equity = data.equity || {};
      const fundamentals = data.fundamentals || {};
      const news = data.recentNews || [];
      const earnings = data.upcomingEarnings;
      
      // Header
      document.getElementById('company-ticker').textContent = equity.ticker || data.ticker || '---';
      document.getElementById('company-name').textContent = equity.name || data.name || 'Unknown';
      document.getElementById('company-sector').textContent = (equity.sector || data.sector || '--').replace('_', ' ');
      
      if (equity.price) {
        document.getElementById('current-price').textContent = formatCurrency(equity.price).replace('$', '');
        const changeEl = document.getElementById('price-change');
        changeEl.textContent = (equity.change >= 0 ? '+' : '') + formatNumber(equity.change) + ' (' + formatPercent(equity.changePercent) + ')';
        changeEl.className = 'price-change ' + getChangeClass(equity.change);
      }
      
      // Key metrics
      const metricsHtml = 
        renderMetric('Market Cap', equity.marketCap, 'large') +
        renderMetric('P/E Ratio', fundamentals.pe || equity.pe, 'number') +
        renderMetric('EPS', equity.eps, 'number') +
        renderMetric('Dividend Yield', equity.dividendYield, 'percent') +
        renderMetric('52W Range', equity.low + ' - ' + equity.high, 'text') +
        renderMetric('Avg Volume', equity.avgVolume, 'large');
      document.getElementById('key-metrics').innerHTML = metricsHtml;
      
      // Earnings
      if (earnings) {
        const earningsCard = document.getElementById('earnings-card');
        earningsCard.style.display = 'block';
        document.getElementById('earnings-date').textContent = new Date(earnings.eventTime).toLocaleDateString();
        document.getElementById('earnings-estimate').textContent = 'Est. EPS: $' + formatNumber(earnings.estimate, 2);
      }
      
      // Fundamentals
      document.getElementById('valuation-metrics').innerHTML = 
        renderFundamentalRow('P/E Ratio', fundamentals.pe, 'number') +
        renderFundamentalRow('Forward P/E', fundamentals.forwardPe, 'number') +
        renderFundamentalRow('PEG Ratio', fundamentals.peg, 'number') +
        renderFundamentalRow('Price/Book', fundamentals.priceToBook, 'number') +
        renderFundamentalRow('Price/Sales', fundamentals.priceToSales, 'number') +
        renderFundamentalRow('EV/EBITDA', fundamentals.evToEbitda, 'number');
      
      document.getElementById('profitability-metrics').innerHTML = 
        renderFundamentalRow('Gross Margin', fundamentals.grossMargin, 'percent') +
        renderFundamentalRow('Operating Margin', fundamentals.operatingMargin, 'percent') +
        renderFundamentalRow('Net Margin', fundamentals.netMargin, 'percent') +
        renderFundamentalRow('ROE', fundamentals.roe, 'percent') +
        renderFundamentalRow('ROA', fundamentals.roa, 'percent') +
        renderFundamentalRow('ROIC', fundamentals.roic, 'percent');
      
      document.getElementById('health-metrics').innerHTML = 
        renderFundamentalRow('Current Ratio', fundamentals.currentRatio, 'number') +
        renderFundamentalRow('Quick Ratio', fundamentals.quickRatio, 'number') +
        renderFundamentalRow('Debt/Equity', fundamentals.debtToEquity, 'number') +
        renderFundamentalRow('Free Cash Flow', fundamentals.freeCashFlow, 'large');
      
      // News
      if (news.length > 0) {
        document.getElementById('news-list').innerHTML = news.slice(0, 5).map(article => 
          '<div class="news-item" data-id="' + article.id + '">' +
            '<div class="news-headline">' + escapeHtml(article.headline) + '</div>' +
            '<div class="news-meta">' +
              '<span>' + escapeHtml(article.source) + '</span>' +
              '<span>' + timeAgo(article.publishedAt) + '</span>' +
            '</div>' +
          '</div>'
        ).join('');
        
        document.querySelectorAll('.news-item').forEach(item => {
          item.addEventListener('click', () => {
            sendMessage('Tell me more about this news article');
          });
        });
      }
      
      requestAnimationFrame(reportHeight);
    }
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById('tab-' + tab).classList.add('active');
        
        requestAnimationFrame(reportHeight);
      });
    });
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.equity || data.fundamentals || data.ticker) {
            renderResearch(data);
          }
        } catch (err) {
          console.error('Error parsing research data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
