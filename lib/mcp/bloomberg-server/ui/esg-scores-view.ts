/**
 * ESG Scores View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getEsgScoresViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("ESG Scores")}
  <style>
    .esg-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .esg-title {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .esg-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-sm);
      padding: var(--space-md);
    }

    .esg-card {
      border: 1px solid var(--border);
      background: var(--bg-secondary);
      padding: var(--space-sm);
    }

    .esg-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .esg-value {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .esg-bar {
      height: 6px;
      background: var(--bg-tertiary);
      margin-top: 6px;
      position: relative;
    }

    .esg-bar-fill {
      height: 100%;
      background: var(--accent-blue);
      width: 0;
    }

    .esg-footer {
      padding: 0 var(--space-md) var(--space-md);
      font-size: 11px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="esg-header">
      <div class="esg-title" id="ticker">---</div>
      <div class="text-mono" id="lastUpdated">--</div>
    </div>

    <div class="esg-grid">
      <div class="esg-card">
        <div class="esg-label">Total</div>
        <div class="esg-value" id="totalScore">--</div>
        <div class="esg-bar"><div class="esg-bar-fill" id="totalBar"></div></div>
      </div>
      <div class="esg-card">
        <div class="esg-label">Environment</div>
        <div class="esg-value" id="envScore">--</div>
        <div class="esg-bar"><div class="esg-bar-fill" id="envBar"></div></div>
      </div>
      <div class="esg-card">
        <div class="esg-label">Social</div>
        <div class="esg-value" id="socialScore">--</div>
        <div class="esg-bar"><div class="esg-bar-fill" id="socialBar"></div></div>
      </div>
      <div class="esg-card">
        <div class="esg-label">Governance</div>
        <div class="esg-value" id="govScore">--</div>
        <div class="esg-bar"><div class="esg-bar-fill" id="govBar"></div></div>
      </div>
    </div>

    <div class="esg-footer" id="peerInfo">--</div>
  </div>

<script>
${getBaseScripts()}

function setBar(id, value) {
  const bar = document.getElementById(id);
  if (!bar) return;
  const width = Math.max(0, Math.min(100, value));
  bar.style.width = width + '%';
}

function render(data) {
  if (data.error) {
    document.getElementById('ticker').textContent = data.ticker || '---';
    document.getElementById('lastUpdated').textContent = '--';
    document.getElementById('peerInfo').textContent = data.error;
    return;
  }
  document.getElementById('ticker').textContent = data.ticker || '---';
  document.getElementById('lastUpdated').textContent = data.lastUpdated
    ? new Date(data.lastUpdated).getFullYear()
    : '--';

  document.getElementById('totalScore').textContent = formatNumber(data.totalScore || 0);
  document.getElementById('envScore').textContent = formatNumber(data.environmentScore || 0);
  document.getElementById('socialScore').textContent = formatNumber(data.socialScore || 0);
  document.getElementById('govScore').textContent = formatNumber(data.governanceScore || 0);

  setBar('totalBar', data.totalScore || 0);
  setBar('envBar', data.environmentScore || 0);
  setBar('socialBar', data.socialScore || 0);
  setBar('govBar', data.governanceScore || 0);

  document.getElementById('peerInfo').textContent =
    'Peer Group: ' + (data.peerGroup || '--') +
    ' | Peer Avg: ' + formatNumber(data.peerAverage || 0) +
    ' | Controversy: ' + (data.controversyLevel ?? '--');

  requestAnimationFrame(reportHeight);
}

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if (data.totalScore !== undefined || data.error) {
        render(data);
      }
    } catch (err) {
      console.error('Error parsing ESG data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
