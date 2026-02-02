/**
 * News Feed View - Bloomberg Terminal UI
 * 
 * Displays a rich news feed with article cards, images, URLs, and sentiment indicators.
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
      max-height: 420px;
      overflow-y: auto;
      padding: var(--space-xs);
    }
    
    .news-card {
      display: flex;
      gap: var(--space-sm);
      padding: var(--space-sm);
      margin-bottom: var(--space-xs);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--bg-primary);
      transition: all 0.15s ease;
    }
    
    .news-card:hover {
      background: var(--bg-secondary);
      border-color: var(--border);
    }
    
    .news-card.importance-high {
      border-left: 3px solid var(--accent-orange);
    }
    
    .news-image {
      flex-shrink: 0;
      width: 80px;
      height: 60px;
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      background-size: cover;
      background-position: center;
    }
    
    .news-image.no-image {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 20px;
    }
    
    .news-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .news-headline {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .news-headline a {
      color: inherit;
      text-decoration: none;
    }
    
    .news-headline a:hover {
      text-decoration: underline;
    }
    
    .news-summary {
      font-size: 11px;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .news-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 10px;
      color: var(--text-muted);
      margin-top: auto;
    }
    
    .news-source {
      font-weight: 600;
    }
    
    .news-tickers {
      display: flex;
      gap: 3px;
    }
    
    .ticker-tag {
      padding: 1px 4px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 600;
      cursor: pointer;
    }
    
    .ticker-tag:hover {
      background: var(--accent-blue-bg);
      color: var(--accent-blue);
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
    
    .sentiment-score {
      font-size: 9px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
    
    .news-actions {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    
    .news-action-btn {
      padding: 2px 6px;
      font-size: 9px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .news-action-btn:hover {
      background: var(--bg-tertiary);
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }
    
    .news-link {
      color: var(--accent-blue);
      text-decoration: none;
      font-size: 9px;
    }
    
    .news-link:hover {
      text-decoration: underline;
    }
    
    .empty-state {
      padding: var(--space-xl);
      text-align: center;
      color: var(--text-muted);
    }
    
    .news-footer {
      padding: var(--space-sm) var(--space-md);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-sm);
    }
    
    .load-more-btn {
      padding: 4px 12px;
      font-size: 11px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-tertiary);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .load-more-btn:hover {
      background: var(--accent-blue-bg);
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }
    
    .pagination-info {
      font-size: 10px;
      color: var(--text-muted);
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
      <span class="pagination-info" id="pagination-info"></span>
      <button class="load-more-btn" id="load-more-btn" style="display: none;">Load More</button>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let newsData = [];
    let pagination = { offset: 0, limit: 25, hasMore: false };
    
    function renderNews(articles, paginationData) {
      newsData = articles;
      if (paginationData) pagination = paginationData;
      
      const listEl = document.getElementById('news-list');
      const countEl = document.getElementById('news-count');
      const footerEl = document.getElementById('news-footer');
      const loadMoreBtn = document.getElementById('load-more-btn');
      const paginationInfo = document.getElementById('pagination-info');
      
      countEl.textContent = articles.length + ' article' + (articles.length !== 1 ? 's' : '');
      
      if (articles.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No news articles found</div>';
        footerEl.style.display = 'none';
        requestAnimationFrame(reportHeight);
        return;
      }
      
      listEl.innerHTML = articles.map(article => {
        const tickerTags = (article.tickers || []).slice(0, 3).map(t => 
          '<span class="ticker-tag" data-ticker="' + escapeHtml(t) + '">' + escapeHtml(t) + '</span>'
        ).join('');
        
        const sentimentClass = 'sentiment-' + article.sentiment;
        const scoreDisplay = article.sentimentScore !== undefined 
          ? '<span class="sentiment-score">(' + (article.sentimentScore > 0 ? '+' : '') + article.sentimentScore + ')</span>'
          : '';
        
        const imageHtml = article.imageUrl 
          ? '<div class="news-image" style="background-image: url(' + escapeHtml(article.imageUrl) + ')"></div>'
          : '<div class="news-image no-image">📰</div>';
        
        const headlineHtml = article.url
          ? '<a href="' + escapeHtml(article.url) + '" target="_blank" rel="noopener">' + escapeHtml(article.headline) + '</a>'
          : escapeHtml(article.headline);
        
        return '<div class="news-card' + (article.importance === 'high' ? ' importance-high' : '') + '" data-id="' + article.id + '" data-url="' + escapeHtml(article.url || '') + '">' +
          imageHtml +
          '<div class="news-content">' +
            '<div class="news-headline">' + headlineHtml + '</div>' +
            '<div class="news-summary">' + escapeHtml(article.summary || '') + '</div>' +
            '<div class="news-meta">' +
              '<span class="news-source">' + escapeHtml(article.source) + '</span>' +
              '<span>•</span>' +
              '<span>' + timeAgo(article.publishedAt) + '</span>' +
              '<span class="sentiment-badge ' + sentimentClass + '">' + article.sentiment + '</span>' +
              scoreDisplay +
              (tickerTags ? '<div class="news-tickers">' + tickerTags + '</div>' : '') +
            '</div>' +
            '<div class="news-actions">' +
              (article.url ? '<a href="' + escapeHtml(article.url) + '" target="_blank" rel="noopener" class="news-action-btn">Open Article ↗</a>' : '') +
              '<button class="news-action-btn read-full-btn" data-id="' + article.id + '">Read Full Content</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      
      // Show footer with pagination
      footerEl.style.display = 'flex';
      paginationInfo.textContent = 'Showing ' + articles.length + ' articles • Updated ' + timeAgo(new Date().toISOString());
      
      if (pagination.hasMore) {
        loadMoreBtn.style.display = 'block';
      } else {
        loadMoreBtn.style.display = 'none';
      }
      
      // Add click handlers for tickers
      listEl.querySelectorAll('.ticker-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
          e.stopPropagation();
          const ticker = tag.getAttribute('data-ticker');
          sendMessage('Show me the quote for ' + ticker);
        });
      });
      
      // Add click handlers for read full content
      listEl.querySelectorAll('.read-full-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const article = newsData.find(a => a.id === id);
          if (article && article.url) {
            // Include both URL and headline for fallback search
            sendMessage('Fetch the full article from URL: ' + article.url + ' (headline: "' + article.headline + '")');
          } else if (article) {
            sendMessage('Search for and fetch the full article: "' + article.headline + '"');
          }
        });
      });
      
      requestAnimationFrame(reportHeight);
    }
    
    // Load more button handler
    document.getElementById('load-more-btn').addEventListener('click', () => {
      sendMessage('Load more news articles (offset: ' + (pagination.offset + pagination.limit) + ')');
    });
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.articles && Array.isArray(data.articles)) {
            renderNews(data.articles, data.pagination);
          } else if (Array.isArray(data)) {
            renderNews(data, null);
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
