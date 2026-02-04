/**
 * Options Chain View - Bloomberg Terminal UI
 */

import { getBaseHead, getBaseScripts } from "./base";

export function getOptionsChainViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead("Options Chain")}
  <style>
    .chain-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .chain-title {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chain-ticker {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
    }

    .chain-subtitle {
      font-size: 11px;
      color: var(--text-muted);
    }

    .chain-controls {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .chain-price {
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 600;
    }

    .chain-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-sm);
      padding: var(--space-md);
    }

    .chain-card {
      border: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .chain-card-header {
      padding: var(--space-xs) var(--space-sm);
      border-bottom: 1px solid var(--border);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .chain-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .chain-table th,
    .chain-table td {
      padding: 4px 6px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: right;
      font-family: var(--font-mono);
    }

    .chain-table th {
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-muted);
      font-weight: 500;
    }

    .chain-table th:first-child,
    .chain-table td:first-child {
      text-align: left;
    }

    .itm {
      background: var(--accent-green-bg);
    }

    .otm {
      background: transparent;
    }

    .empty-state {
      padding: var(--space-md);
      color: var(--text-muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="chain-header">
      <div class="chain-title">
        <div class="chain-ticker" id="ticker">---</div>
        <div class="chain-subtitle" id="expiration">Expiration: --</div>
      </div>
      <div class="chain-controls">
        <select class="input" id="expirationSelect" style="width: 140px;"></select>
        <div class="chain-price" id="underlying">--</div>
      </div>
    </div>

    <div class="chain-grid" id="chainGrid">
      <div class="chain-card">
        <div class="chain-card-header">Calls</div>
        <div class="data-table-container">
          <table class="chain-table">
            <thead>
              <tr>
                <th>Strike</th>
                <th>Last</th>
                <th>Bid</th>
                <th>Ask</th>
                <th>Vol</th>
                <th>OI</th>
                <th>IV</th>
              </tr>
            </thead>
            <tbody id="callsBody">
              <tr><td colspan="7" class="empty-state">Loading calls...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="chain-card">
        <div class="chain-card-header">Puts</div>
        <div class="data-table-container">
          <table class="chain-table">
            <thead>
              <tr>
                <th>Strike</th>
                <th>Last</th>
                <th>Bid</th>
                <th>Ask</th>
                <th>Vol</th>
                <th>OI</th>
                <th>IV</th>
              </tr>
            </thead>
            <tbody id="putsBody">
              <tr><td colspan="7" class="empty-state">Loading puts...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

<script>
${getBaseScripts()}

let currentTicker = '';
let currentExpirations = [];

function renderTableRows(rows, tbody) {
  if (!rows || rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No data</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((row) => {
    const cls = row.inTheMoney ? 'itm' : 'otm';
    return '<tr class="' + cls + '">' +
      '<td>' + formatNumber(row.strike) + '</td>' +
      '<td>' + formatNumber(row.last) + '</td>' +
      '<td>' + formatNumber(row.bid) + '</td>' +
      '<td>' + formatNumber(row.ask) + '</td>' +
      '<td>' + formatNumber(row.volume) + '</td>' +
      '<td>' + formatNumber(row.openInterest) + '</td>' +
      '<td>' + formatPercent(row.impliedVolatility * 100) + '</td>' +
    '</tr>';
  }).join('');
}

function populateExpirations(expirations, selected) {
  const select = document.getElementById('expirationSelect');
  if (!select) return;
  select.innerHTML = '';

  expirations.forEach((exp) => {
    const option = document.createElement('option');
    option.value = exp;
    option.textContent = exp;
    if (exp === selected) option.selected = true;
    select.appendChild(option);
  });
}

async function loadExpiration(expiration) {
  if (!currentTicker || !expiration) return;

  try {
    const result = await callTool('options_chain', { ticker: currentTicker, expiration });
    if (result?.content?.[0]?.text) {
      const data = JSON.parse(result.content[0].text);
      renderChain(data);
    }
  } catch (err) {
    console.error('Failed to load expiration', err);
  }
}

function renderChain(data) {
  if (data.error) {
    document.getElementById('ticker').textContent = data.ticker || '---';
    document.getElementById('expiration').textContent = 'Expiration: --';
    document.getElementById('underlying').textContent = '--';
    document.getElementById('callsBody').innerHTML = '<tr><td colspan="7" class="empty-state">' + data.error + '</td></tr>';
    document.getElementById('putsBody').innerHTML = '<tr><td colspan="7" class="empty-state">' + data.error + '</td></tr>';
    requestAnimationFrame(reportHeight);
    return;
  }
  currentTicker = data.ticker || currentTicker;
  document.getElementById('ticker').textContent = data.ticker || '---';
  document.getElementById('expiration').textContent = 'Expiration: ' + (data.expiration || '--');
  document.getElementById('underlying').textContent = data.underlyingPrice
    ? formatCurrency(data.underlyingPrice)
    : '--';

  const calls = (data.calls || []).slice(0, 30);
  const puts = (data.puts || []).slice(0, 30);
  renderTableRows(calls, document.getElementById('callsBody'));
  renderTableRows(puts, document.getElementById('putsBody'));

  currentExpirations = data.availableExpirations || [];
  if (currentExpirations.length > 0) {
    populateExpirations(currentExpirations, data.expiration);
  }

  requestAnimationFrame(reportHeight);
}

const select = document.getElementById('expirationSelect');
select.addEventListener('change', () => {
  const value = select.value;
  loadExpiration(value);
});

window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
    try {
      const data = JSON.parse(payload.content[0].text);
      if ((data.calls && data.puts) || data.error) {
        renderChain(data);
      }
    } catch (err) {
      console.error('Error parsing options chain data:', err);
    }
  }
});
</script>
</body>
</html>`;
}
