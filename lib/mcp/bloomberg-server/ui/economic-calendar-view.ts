/**
 * Economic Calendar View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getEconomicCalendarViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Economic Calendar")}
  <style>
    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .calendar-title {
      font-size: 16px;
      font-weight: 700;
    }

    .calendar-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .calendar-table th,
    .calendar-table td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
    }

    .calendar-table th {
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-size: 10px;
      color: var(--text-muted);
    }

    .impact-high { color: var(--accent-red); }
    .impact-medium { color: var(--accent-yellow); }
    .impact-low { color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="card">
    <div class="calendar-header">
      <div class="calendar-title">Economic Calendar</div>
      <div class="text-mono" id="range">--</div>
    </div>

    <div class="data-table-container">
      <table class="calendar-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Country</th>
            <th>Event</th>
            <th>Actual</th>
            <th>Estimate</th>
            <th>Previous</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody id="eventsBody">
          <tr><td colspan="7" class="empty-state">Loading events...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

<script>
${getBaseScripts()}

function render(data) {
  if (data.error) {
    document.getElementById('eventsBody').innerHTML = '<tr><td colspan="7" class="empty-state">' + data.error + '</td></tr>';
    requestAnimationFrame(reportHeight);
    return;
  }
  const events = data.events || data || [];
  if (!Array.isArray(events)) return;

  const rows = events.map((e) => {
    const date = e.date || e.eventTime || '';
    const impact = e.impact || e.importance || 'low';
    return '<tr>' +
      '<td>' + (date ? new Date(date).toLocaleDateString() : '--') + '</td>' +
      '<td>' + escapeHtml(e.country || '--') + '</td>' +
      '<td>' + escapeHtml(e.event || '--') + '</td>' +
      '<td class="text-mono">' + (e.actual ?? '--') + '</td>' +
      '<td class="text-mono">' + (e.estimate ?? '--') + '</td>' +
      '<td class="text-mono">' + (e.previous ?? '--') + '</td>' +
      '<td class="impact-' + impact + '">' + impact.toUpperCase() + '</td>' +
    '</tr>';
  }).join('');

  document.getElementById('eventsBody').innerHTML = rows || '<tr><td colspan="7" class="empty-state">No events</td></tr>';
  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (data.events || Array.isArray(data) || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing economic calendar data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
