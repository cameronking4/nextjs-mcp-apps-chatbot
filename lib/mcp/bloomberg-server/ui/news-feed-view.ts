/**
 * News Feed View - Bloomberg Terminal UI
 * 
 * Displays a compact scrollable news feed with headlines, sources, and timestamps.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getNewsFeedViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Financial News')}
  <style>
    .news-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .news-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .news-count {
      font-size: 11px;
      color: var(--text-muted);
    }
    
    .news-list {
      max-height: 350px;
      overflow-y: auto;
    }
    
    .news-item {
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    
    .news-item:hover {
      background: var(--bg-secondary);
    }
    
    .news-item:last-child {
      border-bottom: none;
    }
    
    .news-headline {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.3;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .news-summary {
      font-size: 11px;
      color: var(--text-secondary);
      line-height: 1.4;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .news-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-sm);
      font-size: 10px;
      color: var(--text-muted);
    }
    
    .news-source {
      font-weight: 600;
    }
    
    .news-tickers {
      display: flex;
      gap: 4px;
    }
    
    .ticker-tag {
      padding: 1px 4px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 600;
    }
    
    .sentiment-badge {
      padding: 1px 4px;
      border-radius: 2px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .sentiment-bullish {
      background: var(--accent-green-bg);
      color: var(--accent-green);
    }
    
    .sentiment-bearish {
      background: var(--accent-red-bg);
      color: var(--accent-red);
    }
    
    .sentiment-neutral, .sentiment-mixed {
      background: var(--bg-tertiary);
      color: var(--text-muted);
    }
    
    .importance-high .news-headline {
      font-weight: 600;
    }
    
    .importance-high::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--accent-orange);
    }
    
    .news-item.importance-high {
      position: relative;
    }
    
    .empty-state {
      padding: var(--space-xl);
      text-align: center;
      color: var(--text-muted);
    }
    
    .news-footer {
      padding: var(--space-xs) var(--space-md);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .filter-tags {
      display: flex;
      gap: var(--space-xs);
      flex-wrap: wrap;
    }
    
    .filter-tag {
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
      font-size: 10px;
      color: var(--text-secondary);
    }
  </style>
</head>
<body>
  <div class="card" id="news-card">
    <div class="news-header">
      <span class="news-title">Financial News</span>
      <span class="news-count" id="news-count">-- articles</span>
    </div>
    
    <div class="news-list" id="news-list">
      <div class="empty-state">Loading news...</div>
    </div>
    
    <div class="news-footer" id="news-footer" style="display: none;">
      <div class="filter-tags" id="filter-tags"></div>
      <span class="text-muted text-xs" id="last-updated"></span>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let newsData = [];
    let filters = {};
    
    function renderNews(articles) {
      newsData = articles;
      const listEl = document.getElementById('news-list');
      const countEl = document.getElementById('news-count');
      const footerEl = document.getElementById('news-footer');
      
      countEl.textContent = articles.length + ' article' + (articles.length !== 1 ? 's' : '');
      
      if (articles.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No news articles found</div>';
        footerEl.style.display = 'none';
        requestAnimationFrame(reportHeight);
        return;
      }
      
      listEl.innerHTML = articles.map(article => {
        const tickerTags = article.tickers.slice(0, 3).map(t => 
          '<span class="ticker-tag">' + escapeHtml(t) + '</span>'
        ).join('');
        
        const sentimentClass = 'sentiment-' + article.sentiment;
        
        return '<div class="news-item' + (article.importance === 'high' ? ' importance-high' : '') + '" data-id="' + article.id + '">' +
          '<div class="news-headline">' + escapeHtml(article.headline) + '</div>' +
          '<div class="news-summary">' + escapeHtml(article.summary) + '</div>' +
          '<div class="news-meta">' +
            '<span class="news-source">' + escapeHtml(article.source) + '</span>' +
            '<span>' + timeAgo(article.publishedAt) + '</span>' +
            '<span class="sentiment-badge ' + sentimentClass + '">' + article.sentiment + '</span>' +
            '<div class="news-tickers">' + tickerTags + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      
      footerEl.style.display = 'flex';
      document.getElementById('last-updated').textContent = 'Updated ' + timeAgo(new Date().toISOString());
      
      // Add click handlers
      listEl.querySelectorAll('.news-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          const article = newsData.find(a => a.id === id);
          if (article) {
            sendMessage('Tell me more about: ' + article.headline);
          }
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
          if (data.articles && Array.isArray(data.articles)) {
            renderNews(data.articles);
          } else if (Array.isArray(data)) {
            renderNews(data);
          }
        } catch (err) {
          console.error('Error parsing news data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
