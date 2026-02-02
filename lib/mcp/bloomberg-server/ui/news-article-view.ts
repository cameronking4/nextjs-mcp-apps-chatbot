/**
 * News Article View - Bloomberg Terminal UI
 * 
 * Displays full article content scraped via Firecrawl.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getNewsArticleViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Article')}
  <style>
    .article-container {
      max-height: 480px;
      overflow-y: auto;
      padding: var(--space-md);
    }
    
    .article-header {
      padding-bottom: var(--space-md);
      border-bottom: 1px solid var(--border);
      margin-bottom: var(--space-md);
    }
    
    .article-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
      margin-bottom: var(--space-sm);
    }
    
    .article-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-sm);
      font-size: 12px;
      color: var(--text-muted);
    }
    
    .article-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .article-author {
      font-weight: 500;
      color: var(--text-secondary);
    }
    
    .article-source-link {
      color: var(--accent-blue);
      text-decoration: none;
    }
    
    .article-source-link:hover {
      text-decoration: underline;
    }
    
    .article-image {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      border-radius: var(--radius-md);
      margin-bottom: var(--space-md);
    }
    
    .article-content {
      font-size: 14px;
      line-height: 1.7;
      color: var(--text-primary);
    }
    
    .article-content h1,
    .article-content h2,
    .article-content h3 {
      font-weight: 600;
      margin-top: var(--space-md);
      margin-bottom: var(--space-sm);
      color: var(--text-primary);
    }
    
    .article-content h1 { font-size: 18px; }
    .article-content h2 { font-size: 16px; }
    .article-content h3 { font-size: 14px; }
    
    .article-content p {
      margin-bottom: var(--space-sm);
    }
    
    .article-content a {
      color: var(--accent-blue);
      text-decoration: none;
    }
    
    .article-content a:hover {
      text-decoration: underline;
    }
    
    .article-content ul,
    .article-content ol {
      margin-left: var(--space-md);
      margin-bottom: var(--space-sm);
    }
    
    .article-content blockquote {
      border-left: 3px solid var(--accent-blue);
      padding-left: var(--space-md);
      margin: var(--space-md) 0;
      color: var(--text-secondary);
      font-style: italic;
    }
    
    .article-content code {
      background: var(--bg-tertiary);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 12px;
    }
    
    .article-content pre {
      background: var(--bg-tertiary);
      padding: var(--space-sm);
      border-radius: var(--radius-md);
      overflow-x: auto;
      margin-bottom: var(--space-sm);
    }
    
    .article-content pre code {
      background: none;
      padding: 0;
    }
    
    .article-footer {
      padding: var(--space-sm) var(--space-md);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .open-original-btn {
      padding: 6px 12px;
      font-size: 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--accent-blue);
      background: transparent;
      color: var(--accent-blue);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    
    .open-original-btn:hover {
      background: var(--accent-blue-bg);
    }
    
    .error-state {
      padding: var(--space-xl);
      text-align: center;
      color: var(--text-muted);
    }
    
    .loading-state {
      padding: var(--space-xl);
      text-align: center;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="card" id="article-card">
    <div class="article-container" id="article-container">
      <div class="loading-state">Loading article...</div>
    </div>
    
    <div class="article-footer" id="article-footer" style="display: none;">
      <span class="text-muted text-xs">Powered by Firecrawl</span>
      <a href="#" target="_blank" rel="noopener" class="open-original-btn" id="open-original-btn">
        Open Original ↗
      </a>
    </div>
  </div>

  <script>
    ${getBaseScripts()}
    
    // Simple markdown to HTML converter
    function markdownToHtml(markdown) {
      if (!markdown) return '';
      
      return markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, '<strong><em>$1</em></strong>')
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
        // Links
        .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Code blocks
        .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
        .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Lists
        .replace(/^\\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^\\d+\\. (.*$)/gim, '<li>$1</li>')
        // Paragraphs
        .replace(/\\n\\n/g, '</p><p>')
        .replace(/\\n/g, '<br>')
        // Wrap in paragraphs
        .replace(/^(.+)$/gm, function(match) {
          if (match.startsWith('<')) return match;
          return '<p>' + match + '</p>';
        });
    }
    
    function renderArticle(data) {
      const containerEl = document.getElementById('article-container');
      const footerEl = document.getElementById('article-footer');
      const openBtn = document.getElementById('open-original-btn');
      
      if (data.error) {
        containerEl.innerHTML = '<div class="error-state">' + escapeHtml(data.error) + '</div>';
        footerEl.style.display = 'none';
        requestAnimationFrame(reportHeight);
        return;
      }
      
      const imageHtml = data.imageUrl 
        ? '<img src="' + escapeHtml(data.imageUrl) + '" alt="" class="article-image" onerror="this.style.display=\\'none\\'">'
        : '';
      
      const authorHtml = data.author 
        ? '<span class="article-meta-item"><span class="article-author">' + escapeHtml(data.author) + '</span></span>'
        : '';
      
      const dateHtml = data.publishedDate 
        ? '<span class="article-meta-item">' + timeAgo(data.publishedDate) + '</span>'
        : '';
      
      const sourceHtml = data.url
        ? '<span class="article-meta-item"><a href="' + escapeHtml(data.url) + '" target="_blank" rel="noopener" class="article-source-link">' + extractDomain(data.url) + '</a></span>'
        : '';
      
      const contentHtml = markdownToHtml(data.content || '');
      
      containerEl.innerHTML = 
        '<div class="article-header">' +
          '<div class="article-title">' + escapeHtml(data.title || 'Untitled Article') + '</div>' +
          '<div class="article-meta">' +
            authorHtml +
            (authorHtml && dateHtml ? '<span>•</span>' : '') +
            dateHtml +
            ((authorHtml || dateHtml) && sourceHtml ? '<span>•</span>' : '') +
            sourceHtml +
          '</div>' +
        '</div>' +
        imageHtml +
        '<div class="article-content">' + contentHtml + '</div>';
      
      if (data.url) {
        openBtn.href = data.url;
        footerEl.style.display = 'flex';
      } else {
        footerEl.style.display = 'none';
      }
      
      requestAnimationFrame(reportHeight);
    }
    
    function extractDomain(url) {
      try {
        return new URL(url).hostname.replace(/^www\\./, '');
      } catch {
        return 'Source';
      }
    }
    
    // Listen for data
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          renderArticle(data);
        } catch (err) {
          console.error('Error parsing article data:', err);
        }
      }
    });
  </script>
</body>
</html>`;
}
