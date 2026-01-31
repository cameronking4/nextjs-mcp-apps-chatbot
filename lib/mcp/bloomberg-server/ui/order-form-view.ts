/**
 * Order Form View - Bloomberg Terminal UI
 * 
 * Displays a trading order form with order type selection and validation.
 */

import { getBaseHead, getBaseScripts } from './base';

export function getOrderFormViewHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${getBaseHead('Trade Order')}
  <style>
    .order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .order-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .order-status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: 10px;
      font-weight: 600;
    }
    
    .status-pending {
      background: var(--accent-yellow-bg);
      color: var(--accent-yellow);
    }
    
    .status-filled {
      background: var(--accent-green-bg);
      color: var(--accent-green);
    }
    
    .status-cancelled {
      background: var(--accent-red-bg);
      color: var(--accent-red);
    }
    
    .order-content {
      padding: var(--space-md);
    }
    
    .order-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-sm);
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .form-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .form-input {
      padding: var(--space-sm);
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-family: var(--font-mono);
      color: var(--text-primary);
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--focus-ring);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .form-input::placeholder {
      color: var(--text-muted);
    }
    
    .side-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-xs);
    }
    
    .side-btn {
      padding: var(--space-sm);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .side-btn:hover {
      background: var(--bg-tertiary);
    }
    
    .side-btn.active.buy {
      background: var(--accent-green-bg);
      color: var(--accent-green);
      border-color: var(--accent-green);
    }
    
    .side-btn.active.sell {
      background: var(--accent-red-bg);
      color: var(--accent-red);
      border-color: var(--accent-red);
    }
    
    .type-selector {
      display: flex;
      gap: var(--space-xs);
    }
    
    .type-btn {
      flex: 1;
      padding: var(--space-xs) var(--space-sm);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .type-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    
    .type-btn.active {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-color: var(--text-muted);
    }
    
    .order-summary {
      padding: var(--space-sm);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;
    }
    
    .summary-row:not(:last-child) {
      border-bottom: 1px solid var(--border-subtle);
    }
    
    .summary-label {
      color: var(--text-muted);
    }
    
    .summary-value {
      font-weight: 500;
      font-family: var(--font-mono);
    }
    
    .summary-total {
      font-weight: 700;
      font-size: 14px;
    }
    
    .order-footer {
      display: flex;
      gap: var(--space-sm);
      padding: var(--space-md);
      border-top: 1px solid var(--border);
    }
    
    .submit-btn {
      flex: 1;
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .submit-btn.buy {
      background: var(--accent-green);
      color: white;
      border: none;
    }
    
    .submit-btn.sell {
      background: var(--accent-red);
      color: white;
      border: none;
    }
    
    .submit-btn:hover {
      opacity: 0.9;
    }
    
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .cancel-btn {
      padding: var(--space-sm) var(--space-md);
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    
    .cancel-btn:hover {
      background: var(--bg-tertiary);
    }
    
    .order-confirmation {
      display: none;
      flex-direction: column;
      align-items: center;
      padding: var(--space-xl);
      text-align: center;
    }
    
    .order-confirmation.visible {
      display: flex;
    }
    
    .confirmation-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-md);
    }
    
    .confirmation-icon.success {
      background: var(--accent-green-bg);
      color: var(--accent-green);
    }
    
    .confirmation-icon svg {
      width: 24px;
      height: 24px;
    }
    
    .confirmation-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: var(--space-xs);
    }
    
    .confirmation-details {
      font-size: 12px;
      color: var(--text-muted);
    }
    
    .mock-notice {
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
      padding: var(--space-xs);
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="card" id="order-card">
    <div class="order-header">
      <span class="order-title">Trade Order</span>
      <span class="order-status status-pending" id="order-status" style="display: none;">Pending</span>
    </div>
    
    <div class="order-content" id="order-form-container">
      <div class="order-form">
        <div class="form-group">
          <label class="form-label">Symbol</label>
          <input type="text" class="form-input" id="ticker-input" placeholder="AAPL" maxlength="10">
        </div>
        
        <div class="form-group">
          <label class="form-label">Side</label>
          <div class="side-selector">
            <button type="button" class="side-btn buy active" id="buy-btn">Buy</button>
            <button type="button" class="side-btn sell" id="sell-btn">Sell</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Order Type</label>
          <div class="type-selector">
            <button type="button" class="type-btn active" data-type="market">Market</button>
            <button type="button" class="type-btn" data-type="limit">Limit</button>
            <button type="button" class="type-btn" data-type="stop">Stop</button>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input type="number" class="form-input" id="qty-input" placeholder="100" min="1" step="1">
          </div>
          <div class="form-group" id="price-group" style="display: none;">
            <label class="form-label">Price</label>
            <input type="number" class="form-input" id="price-input" placeholder="0.00" min="0" step="0.01">
          </div>
        </div>
        
        <div class="order-summary" id="order-summary">
          <div class="summary-row">
            <span class="summary-label">Estimated Price</span>
            <span class="summary-value" id="est-price">--</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Quantity</span>
            <span class="summary-value" id="sum-qty">--</span>
          </div>
          <div class="summary-row">
            <span class="summary-label summary-total">Estimated Total</span>
            <span class="summary-value summary-total" id="est-total">--</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="order-confirmation" id="order-confirmation">
      <div class="confirmation-icon success">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>
      <div class="confirmation-title" id="confirmation-title">Order Placed</div>
      <div class="confirmation-details" id="confirmation-details">Your order has been submitted</div>
    </div>
    
    <div class="order-footer" id="order-footer">
      <button type="button" class="cancel-btn" id="cancel-btn">Cancel</button>
      <button type="button" class="submit-btn buy" id="submit-btn" disabled>Place Buy Order</button>
    </div>
    
    <div class="mock-notice">This is a simulated order for demonstration purposes only</div>
  </div>

  <script>
    ${getBaseScripts()}
    
    let orderSide = 'buy';
    let orderType = 'market';
    let currentPrice = 0;
    let ticker = '';
    
    const tickerInput = document.getElementById('ticker-input');
    const qtyInput = document.getElementById('qty-input');
    const priceInput = document.getElementById('price-input');
    const priceGroup = document.getElementById('price-group');
    const submitBtn = document.getElementById('submit-btn');
    
    function updateSummary() {
      const qty = parseInt(qtyInput.value) || 0;
      const price = orderType === 'market' ? currentPrice : (parseFloat(priceInput.value) || 0);
      
      document.getElementById('est-price').textContent = price > 0 ? formatCurrency(price) : '--';
      document.getElementById('sum-qty').textContent = qty > 0 ? formatNumber(qty, 0) : '--';
      document.getElementById('est-total').textContent = (qty > 0 && price > 0) ? formatCurrency(qty * price) : '--';
      
      // Enable/disable submit
      const isValid = ticker && qty > 0 && (orderType === 'market' || price > 0);
      submitBtn.disabled = !isValid;
    }
    
    // Side selection
    document.getElementById('buy-btn').addEventListener('click', () => {
      orderSide = 'buy';
      document.getElementById('buy-btn').classList.add('active');
      document.getElementById('sell-btn').classList.remove('active');
      submitBtn.className = 'submit-btn buy';
      submitBtn.textContent = 'Place Buy Order';
    });
    
    document.getElementById('sell-btn').addEventListener('click', () => {
      orderSide = 'sell';
      document.getElementById('sell-btn').classList.add('active');
      document.getElementById('buy-btn').classList.remove('active');
      submitBtn.className = 'submit-btn sell';
      submitBtn.textContent = 'Place Sell Order';
    });
    
    // Order type selection
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        orderType = btn.getAttribute('data-type');
        
        priceGroup.style.display = orderType === 'market' ? 'none' : 'block';
        updateSummary();
      });
    });
    
    // Input handlers
    tickerInput.addEventListener('input', (e) => {
      ticker = e.target.value.toUpperCase();
      tickerInput.value = ticker;
      // Try to fetch current price
      if (ticker.length >= 1) {
        // In real implementation, would call equity_quote tool
        currentPrice = 0;
      }
      updateSummary();
    });
    
    qtyInput.addEventListener('input', updateSummary);
    priceInput.addEventListener('input', updateSummary);
    
    // Submit order
    submitBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value);
      const price = orderType === 'market' ? null : parseFloat(priceInput.value);
      
      const orderArgs = {
        ticker: ticker,
        side: orderSide,
        type: orderType,
        qty: qty
      };
      
      if (price) {
        orderArgs.price = price;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      callTool('order_place', orderArgs)
        .then(result => {
          if (result?.content?.[0]?.text) {
            const order = JSON.parse(result.content[0].text);
            showConfirmation(order);
          }
        })
        .catch(err => {
          console.error('Failed to place order:', err);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Place ' + (orderSide === 'buy' ? 'Buy' : 'Sell') + ' Order';
        });
    });
    
    function showConfirmation(order) {
      document.getElementById('order-form-container').style.display = 'none';
      document.getElementById('order-footer').style.display = 'none';
      
      const confirmation = document.getElementById('order-confirmation');
      confirmation.classList.add('visible');
      
      document.getElementById('confirmation-title').textContent = order.status === 'filled' ? 'Order Filled' : 'Order Placed';
      document.getElementById('confirmation-details').textContent = 
        order.side.toUpperCase() + ' ' + order.qty + ' ' + order.ticker + 
        (order.filledPrice ? ' @ ' + formatCurrency(order.filledPrice) : '');
      
      const statusEl = document.getElementById('order-status');
      statusEl.style.display = 'inline-flex';
      statusEl.className = 'order-status status-' + order.status;
      statusEl.textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
      
      requestAnimationFrame(reportHeight);
    }
    
    // Cancel
    document.getElementById('cancel-btn').addEventListener('click', () => {
      sendMessage('Cancel order entry');
    });
    
    // Pre-populate from tool input
    window.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};
      
      if (type === 'mcp:toolInput' && payload?.arguments) {
        const args = payload.arguments;
        if (args.ticker) {
          ticker = args.ticker.toUpperCase();
          tickerInput.value = ticker;
        }
        if (args.qty) {
          qtyInput.value = args.qty;
        }
        if (args.side === 'sell') {
          document.getElementById('sell-btn').click();
        }
        updateSummary();
      }
      
      if (type === 'mcp:toolResult' && payload?.content?.[0]?.text) {
        try {
          const data = JSON.parse(payload.content[0].text);
          if (data.id && data.status) {
            showConfirmation(data);
          } else if (data.price) {
            currentPrice = data.price;
            updateSummary();
          }
        } catch (err) {
          console.error('Error parsing order data:', err);
        }
      }
    });
    
    requestAnimationFrame(reportHeight);
  </script>
</body>
</html>`;
}
