/**
 * Earnings Calendar View
 * Displays upcoming earnings announcements with date, time, and EPS estimates
 */

import { getBaseHead, getBaseScripts, getBaseStyles } from "./base";

export function getEarningsCalendarViewHtml(): string {
  return `<!DOCTYPE html>
<html>
${getBaseHead("Earnings Calendar")}
<style>
${getBaseStyles()}

.calendar-container {
  padding: 12px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.calendar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-range {
  font-size: 11px;
  color: var(--text-muted);
}

.earnings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.earnings-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 12px;
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  align-items: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.earnings-item:hover {
  border-color: var(--accent);
  background: var(--card-bg-hover);
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-day {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.date-time {
  font-size: 10px;
  color: var(--text-muted);
}

.company-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.company-ticker {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.company-name {
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.estimate-cell {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.estimate-label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.estimate-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  font-family: var(--font-mono);
}

.period-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  margin-top: 2px;
  display: inline-block;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 12px;
}
</style>
<body>
  <div class="calendar-container">
    <div class="calendar-header">
      <span class="calendar-title">📅 Upcoming Earnings</span>
      <span class="calendar-range" id="dateRange"></span>
    </div>
    <div class="earnings-list" id="earningsList">
      <div class="empty-state">Loading earnings calendar...</div>
    </div>
  </div>

<script>
${getBaseScripts()}

function formatEarningsDate(dateStr) {
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    day: days[date.getDay()] + ' ' + months[date.getMonth()] + ' ' + date.getDate(),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  };
}

function render(data) {
  const list = document.getElementById('earningsList');
  const range = document.getElementById('dateRange');
  
  const earnings = data.earnings || [];
  
  if (earnings.length === 0) {
    list.innerHTML = '<div class="empty-state">No upcoming earnings in the selected period</div>';
    return;
  }
  
  // Calculate date range
  const dates = earnings.map(e => new Date(e.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  range.textContent = minDate.toLocaleDateString() + ' - ' + maxDate.toLocaleDateString();
  
  list.innerHTML = earnings.map(function(e) {
    const dateInfo = formatEarningsDate(e.date);
    
    return '<div class="earnings-item" onclick="viewCompany(\\'' + escapeHtml(e.ticker) + '\\')">' +
      '<div class="date-cell">' +
        '<span class="date-day">' + escapeHtml(dateInfo.day) + '</span>' +
        '<span class="date-time">' + escapeHtml(dateInfo.time) + '</span>' +
      '</div>' +
      '<div class="company-cell">' +
        '<span class="company-ticker">' + escapeHtml(e.ticker) + '</span>' +
        '<span class="company-name">' + escapeHtml(e.company) + '</span>' +
        '<span class="period-badge">' + escapeHtml(e.period) + '</span>' +
      '</div>' +
      '<div class="estimate-cell">' +
        '<span class="estimate-label">EPS Est</span>' +
        '<span class="estimate-value">' + formatCurrency(e.epsEstimate) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
  
  reportHeight();
}

function viewCompany(ticker) {
  sendMessage('Show me the research summary for ' + ticker);
}

window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'mcp:toolResult') {
    var payload = event.data.payload;
    // Parse the nested JSON structure
    if (payload && payload.content && payload.content[0] && payload.content[0].text) {
      try {
        var data = JSON.parse(payload.content[0].text);
        render(data);
      } catch (err) {
        console.error('Error parsing earnings data:', err);
      }
    } else if (payload && payload.earnings) {
      // Direct data format
      render(payload);
    }
  }
});

initTheme();
</script>
</body>
</html>`;
}
