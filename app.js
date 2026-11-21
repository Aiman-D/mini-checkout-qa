/**
 * Vanilla ES Module Shop Application
 * Exact Currency Math in Integer Cents & Idempotent Checkout
 */

// ============================================================================
// 1. Product Catalog & Definitions (Prices in Integer Cents)
// ============================================================================

export const PRODUCTS = [
  {
    id: 'ceramic-coffee-mug',
    name: 'Ceramic Coffee Mug',
    priceInCents: 1450 // $14.50
  },
  {
    id: 'canvas-tote-bag',
    name: 'Canvas Tote Bag',
    priceInCents: 2275 // $22.75
  }
];

export const PRODUCTS_BY_ID = new Map(PRODUCTS.map(product => [product.id, product]));

// ============================================================================
// 2. Exact Currency Math (Integer Cents - Zero Float Drift)
// ============================================================================

/**
 * Formats integer cents into standard USD string ($X.XX)
 * Pure integer arithmetic guarantees zero floating-point rounding drift.
 * @param {number} cents
 * @returns {string}
 */
export function formatCents(cents) {
  const isNegative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formatted = `$${dollars}.${remainder.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Generates unique order reference matching /^ORD-[A-Z0-9]{6,8}$/
 * @returns {string}
 */
export function generateOrderReference() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomSuffix = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomSuffix += chars[randomIndex];
  }
  return `ORD-${randomSuffix}`;
}

/**
 * Escapes unsafe HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// 3. Application State
// ============================================================================

/**
 * Synchronous in-memory submission lock.
 * When true, guards against rapid double-clicks, double Enter, or programmatic duplicate submits.
 */
let orderPlaced = false;

/**
 * Cart storage Map: productId -> { id, name, priceInCents, quantity }
 */
export const cart = new Map();

/**
 * Calculates overall order total in integer cents.
 * @param {Map} cartMap
 * @returns {number}
 */
export function calculateOrderTotalCents(cartMap = cart) {
  let total = 0;
  for (const item of cartMap.values()) {
    total += (item.priceInCents * item.quantity);
  }
  return total;
}

// ============================================================================
// 4. Cart Mutation Actions
// ============================================================================

/**
 * Adds product to cart or increments quantity if already present.
 * @param {string} productId
 */
export function addToCart(productId) {
  if (orderPlaced) return;

  const product = PRODUCTS_BY_ID.get(productId);
  if (!product) return;

  clearError();

  const existing = cart.get(productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.set(productId, {
      id: product.id,
      name: product.name,
      priceInCents: product.priceInCents,
      quantity: 1
    });
  }

  renderCart();
}

/**
 * Updates item quantity with validation:
 * Setting quantity to 0 removes the item cleanly.
 * Rejects/clamps non-numeric, NaN, or negative inputs predictably.
 * @param {string} productId
 * @param {number|string} newQuantity
 */
export function updateItemQuantity(productId, newQuantity) {
  if (orderPlaced) return;
  if (!cart.has(productId)) return;

  const parsed = typeof newQuantity === 'number' ? newQuantity : parseInt(newQuantity, 10);

  // Reject non-numeric or NaN predictably
  if (isNaN(parsed)) {
    renderCart();
    return;
  }

  // Setting quantity to 0 or negative removes item cleanly
  if (parsed <= 0) {
    cart.delete(productId);
  } else {
    cart.get(productId).quantity = Math.floor(parsed);
  }

  renderCart();
}

/**
 * Removes an item completely from the cart.
 * @param {string} productId
 */
export function removeFromCart(productId) {
  if (orderPlaced) return;
  cart.delete(productId);
  renderCart();
}

// ============================================================================
// 5. Accessible Alert Management
// ============================================================================

export function showError(message) {
  const container = document.getElementById('checkout-alert-container');
  if (!container) return;
  container.innerHTML = `
    <div role="alert" class="alert-box" id="checkout-alert">
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

export function clearError() {
  const container = document.getElementById('checkout-alert-container');
  if (!container) return;
  container.innerHTML = '';
}

// ============================================================================
// 6. UI Rendering & Synchronization
// ============================================================================

/**
 * Synchronizes the order total and line totals in the DOM live.
 */
export function updateCartTotalsOnly() {
  for (const item of cart.values()) {
    const lineTotalEl = document.querySelector(`[data-testid="line-total-${item.id}"]`);
    if (lineTotalEl) {
      lineTotalEl.textContent = formatCents(item.priceInCents * item.quantity);
    }
  }

  const orderTotalEl = document.getElementById('order-total');
  if (orderTotalEl) {
    orderTotalEl.textContent = formatCents(calculateOrderTotalCents(cart));
  }

  const badgeEl = document.getElementById('cart-item-count');
  if (badgeEl) {
    const totalCount = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);
    badgeEl.textContent = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
  }
}

/**
 * Full re-render of the cart items list and summary.
 */
export function renderCart() {
  const cartContent = document.getElementById('cart-content');
  const orderTotalEl = document.getElementById('order-total');
  const badgeEl = document.getElementById('cart-item-count');

  if (!cartContent) return;

  const items = Array.from(cart.values());
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCents = calculateOrderTotalCents(cart);

  if (badgeEl) {
    badgeEl.textContent = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
  }

  if (orderTotalEl) {
    orderTotalEl.textContent = formatCents(totalCents);
  }

  if (items.length === 0) {
    cartContent.innerHTML = `
      <p class="empty-cart-message" data-testid="empty-cart-message">Your cart is empty.</p>
    `;
    return;
  }

  const itemsHtml = items.map(item => {
    const lineTotalCents = item.priceInCents * item.quantity;
    return `
      <div class="cart-item-row" data-id="${item.id}" data-testid="cart-item-${item.id}">
        <div class="cart-item-info">
          <span class="cart-item-title">${escapeHtml(item.name)}</span>
          <span class="cart-item-unit-price">${formatCents(item.priceInCents)} each</span>
        </div>
        <div class="cart-item-controls">
          <div class="cart-line-actions">
            <div class="cart-qty-group">
              <button 
                type="button" 
                class="btn-qty btn-decrease" 
                data-id="${item.id}" 
                data-testid="decrease-${item.id}" 
                aria-label="Decrease quantity of ${escapeHtml(item.name)}"
                title="Decrease quantity"
                ${orderPlaced ? 'disabled' : ''}>
                -
              </button>
              <input 
                type="number" 
                class="input-qty" 
                data-id="${item.id}" 
                data-testid="qty-${item.id}" 
                aria-label="Quantity of ${escapeHtml(item.name)}" 
                min="0" 
                step="1"
                value="${item.quantity}"
                ${orderPlaced ? 'disabled' : ''}
              >
              <button 
                type="button" 
                class="btn-qty btn-increase" 
                data-id="${item.id}" 
                data-testid="increase-${item.id}" 
                aria-label="Increase quantity of ${escapeHtml(item.name)}"
                title="Increase quantity"
                ${orderPlaced ? 'disabled' : ''}>
                +
              </button>
            </div>
            <span class="cart-line-total" data-testid="line-total-${item.id}">${formatCents(lineTotalCents)}</span>
            <button 
              type="button" 
              class="btn-remove" 
              data-id="${item.id}" 
              data-testid="remove-${item.id}" 
              aria-label="Remove ${escapeHtml(item.name)}"
              title="Remove from cart"
              ${orderPlaced ? 'disabled' : ''}>
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  cartContent.innerHTML = `<div class="cart-items-list" data-testid="cart-items-list">${itemsHtml}</div>`;
}

/**
 * Disables all interactive controls upon successful order placement.
 */
export function disableAllControls() {
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (placeOrderBtn) placeOrderBtn.disabled = true;

  const nameInput = document.getElementById('customer-name');
  if (nameInput) nameInput.disabled = true;

  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.disabled = true;
  });

  document.querySelectorAll('.btn-qty, .btn-remove, .input-qty').forEach(el => {
    el.disabled = true;
  });
}

/**
 * Renders exactly ONE confirmation panel with role="status" and data-testid="order-confirmation".
 * @param {Object} details
 */
export function renderConfirmation({ orderReference, customerName, items, totalCents }) {
  const container = document.getElementById('confirmation-container');
  if (!container) return;

  const itemsHtml = items.map(item => `
    <li class="confirmed-item-row" data-testid="confirmed-item-${item.id}">
      <span class="confirmed-item-name">${escapeHtml(item.name)} &times; ${item.quantity}</span>
      <span class="confirmed-item-price">${formatCents(item.priceInCents * item.quantity)}</span>
    </li>
  `).join('');

  container.innerHTML = `
    <section role="status" data-testid="order-confirmation" class="confirmation-panel" id="order-confirmation">
      <h2>Order Confirmed</h2>
      <p class="order-ref-line">
        Order Reference: <strong class="order-reference" data-testid="order-reference">${orderReference}</strong>
      </p>
      <p class="customer-name-line">
        Customer Name: <strong class="confirmed-name" data-testid="confirmed-name">${escapeHtml(customerName)}</strong>
      </p>
      <div class="confirmed-items-section">
        <h3 class="confirmed-items-heading">Itemized Order Summary</h3>
        <ul class="confirmed-items-list" data-testid="confirmed-items-list">
          ${itemsHtml}
        </ul>
        <div class="confirmed-total-line">
          <span>Final Total:</span>
          <strong class="confirmed-total-amount" data-testid="confirmed-total">${formatCents(totalCents)}</strong>
        </div>
      </div>
    </section>
  `;
}

// ============================================================================
// 7. Checkout Form Submission & Double-Submit Protection
// ============================================================================

/**
 * Submit handler with synchronous double-submit lock on line 1.
 * Guards against rapid double-clicks, double Enter, or programmatic duplicate submits.
 * @param {Event} event
 */
export function handleCheckoutSubmit(event) {
  // Synchronous double-submit lock on line 1
  if (orderPlaced) {
    if (event) event.preventDefault();
    return;
  }
  if (event) event.preventDefault();

  const nameInput = document.getElementById('customer-name');
  const rawCustomerName = nameInput ? nameInput.value : '';
  const trimmedName = rawCustomerName.trim();
  const cartItems = Array.from(cart.values());

  // Empty-cart check
  const isCartEmpty = cartItems.length === 0;
  // Whitespace-only name check
  const isNameEmpty = trimmedName === '';

  // Validation: State preservation - input value and cart items intact on error
  if (isCartEmpty && isNameEmpty) {
    showError('Your cart is empty and full name is required. Add at least one item and enter your full name before placing an order.');
    return;
  }

  if (isCartEmpty) {
    showError('Your cart is empty. Add at least one item before placing an order.');
    return;
  }

  if (isNameEmpty) {
    showError('Please enter your full name before placing an order.');
    return;
  }

  // Set synchronous in-memory submission lock immediately
  orderPlaced = true;

  // Clear any active validation error alerts
  clearError();

  // Disable controls and buttons immediately
  disableAllControls();

  // Generate unique order reference matching /^ORD-[A-Z0-9]{6,8}$/
  const orderRef = generateOrderReference();
  const totalCents = calculateOrderTotalCents(cart);

  // Render exactly ONE confirmation panel
  renderConfirmation({
    orderReference: orderRef,
    customerName: trimmedName,
    items: cartItems.map(item => ({ ...item })),
    totalCents: totalCents
  });
}

// ============================================================================
// 8. Event Listeners & Initialization
// ============================================================================

export function initApp() {
  // Initial cart rendering
  renderCart();

  // Product Add to Cart buttons
  const productsGrid = document.getElementById('products-grid');
  if (productsGrid) {
    productsGrid.addEventListener('click', (e) => {
      if (orderPlaced) return;
      const addBtn = e.target.closest('.btn-add-to-cart');
      if (addBtn) {
        const id = addBtn.getAttribute('data-id');
        if (id) addToCart(id);
      }
    });
  }

  // Cart item interactions via event delegation
  const cartContent = document.getElementById('cart-content');
  if (cartContent) {
    cartContent.addEventListener('click', (e) => {
      if (orderPlaced) return;

      const increaseBtn = e.target.closest('.btn-increase');
      if (increaseBtn) {
        const id = increaseBtn.getAttribute('data-id');
        const item = cart.get(id);
        if (item) {
          updateItemQuantity(id, item.quantity + 1);
        }
        return;
      }

      const decreaseBtn = e.target.closest('.btn-decrease');
      if (decreaseBtn) {
        const id = decreaseBtn.getAttribute('data-id');
        const item = cart.get(id);
        if (item) {
          updateItemQuantity(id, item.quantity - 1);
        }
        return;
      }

      const removeBtn = e.target.closest('.btn-remove');
      if (removeBtn) {
        const id = removeBtn.getAttribute('data-id');
        if (id) {
          removeFromCart(id);
        }
        return;
      }
    });

    // Live update on input
    cartContent.addEventListener('input', (e) => {
      if (orderPlaced) return;
      const input = e.target.closest('.input-qty');
      if (!input) return;

      const id = input.getAttribute('data-id');
      const item = cart.get(id);
      if (!item) return;

      const raw = input.value;
      if (raw === '') return; // Wait for complete input

      const parsed = parseInt(raw, 10);
      if (isNaN(parsed) || parsed < 0) {
        input.value = item.quantity;
        return;
      }

      if (parsed > 0) {
        item.quantity = parsed;
        updateCartTotalsOnly();
      }
    });

    // Commit on change
    cartContent.addEventListener('change', (e) => {
      if (orderPlaced) return;
      const input = e.target.closest('.input-qty');
      if (!input) return;

      const id = input.getAttribute('data-id');
      const raw = input.value;
      const parsed = parseInt(raw, 10);

      if (isNaN(parsed) || raw.trim() === '') {
        renderCart();
        return;
      }

      if (parsed <= 0) {
        cart.delete(id);
        renderCart();
      } else {
        updateItemQuantity(id, parsed);
      }
    });
  }

  // Checkout Form Submission
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Extra guard against rapid button clicks
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', (e) => {
      if (orderPlaced) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    });
  }

  // Extra guard against rapid double Enter inside input
  const customerNameInput = document.getElementById('customer-name');
  if (customerNameInput) {
    customerNameInput.addEventListener('input', () => {
      clearError();
    });

    customerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && orderPlaced) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    });
  }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
