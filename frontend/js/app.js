/* ── CURRENCY ── */
function formatINR(amount) {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── STATE ── */
const state = {
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  products: [],
  currentPage: 'home',
  detailQty: 1,
};

const API = '';

/* ── ROUTER ── */
async function navigate(page, params = {}) {
  state.currentPage = page;
  window.scrollTo(0, 0);
  const app = document.getElementById('app');
  switch (page) {
    case 'home': await renderHome(); break;
    case 'product': await renderProduct(params.id); break;
    case 'account': renderAccount(); break;
    case 'login': renderLogin(); break;
    case 'register': renderRegister(); break;
    case 'checkout': renderCheckout(); break;
    case 'orders': renderOrders(); break;
    case 'success': renderSuccess(params.orderId); break;
  }
}

/* ── API HELPERS ── */
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(API + path, { headers, ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Error');
  }
  return res.json();
}

/* ── HOME ── */
async function renderHome(category = 'All', sort = 'default', search = '') {
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-grid"></div>
      <img class="hero-img" src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=80" alt="hero">
      <div class="hero-content">
        <div class="hero-label">New Collection 2024</div>
        <h1 class="hero-title">Objects of<br><em>Lasting</em><br>Beauty</h1>
        <p class="hero-desc">Curated objects for modern living — where craft meets intention, and each piece earns its place.</p>
        <div class="hero-actions">
          <button class="btn-primary" onclick="document.getElementById('shopSection').scrollIntoView({behavior:'smooth'})">Explore Collection</button>
          <button class="btn-ghost" onclick="navigate('account')">Our Story</button>
        </div>
      </div>
    </section>
    <section class="shop-section" id="shopSection">
      <div class="section-header">
        <h2 class="section-title">The <span>Collection</span></h2>
        <div class="filter-bar" id="filterBar">
          <select class="sort-select" onchange="renderHome('${category}', this.value, '${search}')">
            <option value="default">Sort: Featured</option>
            <option value="price-asc" ${sort==='price-asc'?'selected':''}>Price: Low to High</option>
            <option value="price-desc" ${sort==='price-desc'?'selected':''}>Price: High to Low</option>
            <option value="rating" ${sort==='rating'?'selected':''}>Top Rated</option>
          </select>
        </div>
      </div>
      <div id="categoryChips" class="filter-bar" style="margin-bottom:32px;"></div>
      <div id="productGrid" class="product-grid"></div>
    </section>`;

  // Load categories + products
  const [cats, products] = await Promise.all([
    apiFetch('/api/categories'),
    apiFetch(`/api/products?category=${encodeURIComponent(category)}&sort=${sort}&search=${encodeURIComponent(search)}`),
  ]);
  state.products = products;

  document.getElementById('categoryChips').innerHTML = cats.map(c =>
    `<button class="filter-chip ${c===category?'active':''}" onclick="renderHome('${c}', '${sort}', '${search}')">${c}</button>`
  ).join('');

  renderProductGrid(products);
}

function renderProductGrid(products) {
  const grid = document.getElementById('productGrid');
  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px;color:var(--text3)">No products found</div>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="navigate('product',{id:'${p.id}'})">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge ${p.badge.toLowerCase()}">${p.badge}</span>` : ''}
        <div class="card-overlay">
          <button class="card-quick-add" onclick="event.stopPropagation();quickAdd('${p.id}')">Add to Cart</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-meta">
          <span class="product-price">${formatINR(p.price)}</span>
          <span class="product-rating"><span class="stars">${'★'.repeat(Math.round(p.rating))}</span> ${p.rating}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── PRODUCT DETAIL ── */
async function renderProduct(id) {
  state.detailQty = 1;
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:60vh;color:var(--text3)">Loading…</div>`;
  const p = await apiFetch(`/api/products/${id}`);
  app.innerHTML = `
    <div class="product-detail">
      <div class="detail-gallery">
        <img src="${p.image}" alt="${p.name}">
      </div>
      <div class="detail-content">
        <div class="detail-breadcrumb">
          <a onclick="navigate('home')">Shop</a> › <span>${p.category}</span> › <span>${p.name}</span>
        </div>
        ${p.badge ? `<div class="detail-badge">${p.badge}</div>` : ''}
        <div class="detail-category">${p.category}</div>
        <h1 class="detail-title">${p.name}</h1>
        <div class="detail-rating">
          <span class="detail-stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5-Math.round(p.rating))}</span>
          <span class="detail-reviews">${p.reviews} reviews</span>
        </div>
        <div class="detail-price">${formatINR(p.price)}</div>
        <p class="detail-desc">${p.description}</p>
        <div class="detail-stock">In Stock — ${p.stock} remaining</div>
        <div class="qty-control">
          <button onclick="changeDetailQty(-1)">−</button>
          <span id="detailQty">1</span>
          <button onclick="changeDetailQty(1)">+</button>
        </div>
        <button class="btn-add-cart" onclick="addToCart('${p.id}','${p.name}','${p.price}','${p.image}')">Add to Cart</button>
        <button class="btn-wishlist">Save to Wishlist</button>
        <div class="detail-features">
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div>
              <div class="feature-label">Free Shipping</div>
              <div class="feature-text">On orders over $75</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <div class="feature-label">30-Day Returns</div>
              <div class="feature-text">Hassle-free guarantee</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <div>
              <div class="feature-label">Secure Payment</div>
              <div class="feature-text">256-bit SSL encrypted</div>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div class="feature-label">Authenticity</div>
              <div class="feature-text">Verified provenance</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function changeDetailQty(delta) {
  state.detailQty = Math.max(1, state.detailQty + delta);
  document.getElementById('detailQty').textContent = state.detailQty;
}

/* ── CART ── */
function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = drawer.classList.contains('open');
  drawer.classList.toggle('open');
  overlay.classList.toggle('hidden', isOpen);
  renderCartDrawer();
}

function renderCartDrawer() {
  const items = state.cart;
  const count = document.getElementById('cartCount');
  count.textContent = items.length ? `(${items.length})` : '';
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');

  if (!items.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p>Your cart is empty</p>
        <p style="font-size:13px;margin-top:8px">Discover something beautiful</p>
      </div>`;
    footer.innerHTML = '';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatINR(item.price * item.qty)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateCartQty('${item.id}',-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.id}',1)">+</button>
          <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  footer.innerHTML = `
    <div class="cart-summary-row"><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>
    <div class="cart-summary-row"><span>Shipping</span><span>$9.99</span></div>
    <div class="cart-total-row"><span>Total</span><span class="price">${formatINR(subtotal + 9.99)}</span></div>
    <button class="btn-checkout" onclick="toggleCart();navigate('checkout')">Proceed to Checkout</button>`;
}

function addToCart(id, name, price, image) {
  const qty = state.detailQty || 1;
  const existing = state.cart.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else state.cart.push({ id, name, price: parseFloat(price), image, qty });
  saveCart();
  updateCartBadge();
  toast(`${name} added to cart`, 'success');
}

function quickAdd(id) {
  const p = state.products.find(p => p.id === id);
  if (p) addToCart(p.id, p.name, p.price, p.image);
}

function updateCartQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
}

function updateCartBadge() {
  const total = state.cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartBadge').textContent = total;
}

/* ── AUTH ── */
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-visual">
        <div class="auth-visual-title">Welcome<br><em>Back</em></div>
        <p class="auth-visual-sub">Sign in to access your orders, saved items and exclusive early access.</p>
      </div>
      <div class="auth-form-wrap">
        <h2 class="auth-form-title">Sign In</h2>
        <p class="auth-form-sub">Access your ShopVault account</p>
        <div id="authError"></div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input class="form-input" type="email" id="loginEmail" placeholder="hello@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" id="loginPassword" placeholder="••••••••">
        </div>
        <button class="btn-submit" onclick="doLogin()">Sign In</button>
        <p class="auth-switch">No account? <a onclick="navigate('register')">Create one →</a></p>
      </div>
    </div>`;
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    toast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
    navigate('account');
  } catch (e) {
    document.getElementById('authError').innerHTML = `<div class="form-error">${e.message}</div>`;
  }
}

function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-visual">
        <div class="auth-visual-title">Join<br><em>ShopVault</em></div>
        <p class="auth-visual-sub">Create an account to enjoy seamless shopping and exclusive member benefits.</p>
      </div>
      <div class="auth-form-wrap">
        <h2 class="auth-form-title">Create Account</h2>
        <p class="auth-form-sub">Start your ShopVault journey</p>
        <div id="authError"></div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-input" type="text" id="regName" placeholder="Your Name">
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input class="form-input" type="email" id="regEmail" placeholder="hello@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" id="regPassword" placeholder="Min 6 characters">
        </div>
        <button class="btn-submit" onclick="doRegister()">Create Account</button>
        <p class="auth-switch">Already have an account? <a onclick="navigate('login')">Sign in →</a></p>
      </div>
    </div>`;
}

async function doRegister() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  if (password.length < 6) {
    document.getElementById('authError').innerHTML = `<div class="form-error">Password must be at least 6 characters</div>`;
    return;
  }
  try {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password }),
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    toast(`Welcome to ShopVault, ${data.user.name.split(' ')[0]}!`, 'success');
    navigate('account');
  } catch (e) {
    document.getElementById('authError').innerHTML = `<div class="form-error">${e.message}</div>`;
  }
}

/* ── ACCOUNT ── */
function renderAccount() {
  if (!state.user) { navigate('login'); return; }
  const initial = state.user.name.charAt(0).toUpperCase();
  document.getElementById('app').innerHTML = `
    <div class="account-page">
      <div class="account-header">
        <div class="account-avatar">${initial}</div>
        <div>
          <div class="account-name">${state.user.name}</div>
          <div class="account-email">${state.user.email}</div>
        </div>
        <button class="btn-logout" onclick="doLogout()" style="margin-left:auto">Sign Out</button>
      </div>
      <div class="account-tabs">
        <button class="account-tab active" onclick="navigate('orders')">Orders</button>
        <button class="account-tab" onclick="navigate('home')">Shop</button>
      </div>
      <div id="ordersContainer"><p style="color:var(--text3)">Loading orders…</p></div>
    </div>`;
  loadOrders();
}

async function renderOrders() {
  if (!state.user) { navigate('login'); return; }
  renderAccount();
}

async function loadOrders() {
  try {
    const orders = await apiFetch('/api/orders');
    const container = document.getElementById('ordersContainer');
    if (!orders.length) {
      container.innerHTML = `<p style="color:var(--text3);text-align:center;padding:60px 0">No orders yet — <a onclick="navigate('home')" style="color:var(--accent);cursor:pointer">start shopping</a></p>`;
      return;
    }
    container.innerHTML = `<div class="orders-list">${orders.map(o => `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-id">#${o.id}</div>
            <div class="order-date">${new Date(o.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
          </div>
          <span class="order-status">${o.status}</span>
        </div>
        <div class="order-items-preview">${o.items.map(i=>`<img class="order-thumb" src="${i.image}" alt="${i.name}">`).join('')}</div>
        <div class="order-card-footer">
          <span style="font-size:13px;color:var(--text3)">${o.items.reduce((s,i)=>s+i.qty,0)} item(s)</span>
          <span class="order-total">${formatINR(o.total)}</span>
        </div>
      </div>`).join('')}</div>`;
  } catch (e) {
    document.getElementById('ordersContainer').innerHTML = `<p style="color:var(--red)">Failed to load orders</p>`;
  }
}

function doLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast('Signed out successfully', 'success');
  navigate('home');
}

/* ── CHECKOUT ── */
function renderCheckout() {
  if (!state.cart.length) { navigate('home'); return; }
  if (!state.user) { navigate('login'); return; }
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + 9.99;

  document.getElementById('app').innerHTML = `
    <div class="checkout-page">
      <div>
        <h2 class="checkout-title">Checkout</h2>
        <div class="checkout-section">
          <div class="checkout-section-title">Shipping Address</div>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" id="shName" value="${state.user.name}" placeholder="Full Name">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="shEmail" value="${state.user.email}" placeholder="Email">
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" id="shAddress" placeholder="123 Main Street">
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">City</label>
              <input class="form-input" id="shCity" placeholder="City">
            </div>
            <div class="form-group">
              <label class="form-label">Postal Code</label>
              <input class="form-input" id="shZip" placeholder="ZIP Code">
            </div>
          </div>
        </div>
        <div class="checkout-section">
          <div class="checkout-section-title">Payment Details</div>
          <div class="form-group">
            <label class="form-label">Card Number</label>
            <input class="form-input" id="cardNum" placeholder="4242 4242 4242 4242" maxlength="19" oninput="formatCard(this)">
          </div>
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Expiry</label>
              <input class="form-input" id="cardExp" placeholder="MM / YY" maxlength="7" oninput="formatExpiry(this)">
            </div>
            <div class="form-group">
              <label class="form-label">CVV</label>
              <input class="form-input" id="cardCvv" placeholder="•••" maxlength="4" type="password">
            </div>
          </div>
          <div id="checkoutError"></div>
          <button class="btn-submit" onclick="placeOrder()">Place Order — ${formatINR(total)}</button>
        </div>
      </div>
      <div>
        <div class="order-summary-card">
          <div class="order-summary-title">Order Summary</div>
          ${state.cart.map(i => `
            <div class="order-item">
              <img src="${i.image}" alt="${i.name}">
              <div>
                <div class="order-item-name">${i.name}</div>
                <div class="order-item-sub">Qty: ${i.qty}</div>
              </div>
              <div class="order-item-price">${formatINR(i.price * i.qty)}</div>
            </div>
          `).join('')}
          <hr class="summary-divider">
          <div class="summary-row"><span>Subtotal</span><span>${formatINR(subtotal)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>$9.99</span></div>
          <div class="summary-row"><span>Tax</span><span>Included</span></div>
          <div class="summary-total"><span>Total</span><span class="price">${formatINR(total)}</span></div>
        </div>
      </div>
    </div>`;
}

function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
  input.value = v;
}

async function placeOrder() {
  const address = document.getElementById('shAddress').value;
  const city = document.getElementById('shCity').value;
  const zip = document.getElementById('shZip').value;
  const card = document.getElementById('cardNum').value;

  if (!address || !city || !zip || !card) {
    document.getElementById('checkoutError').innerHTML = `<div class="form-error">Please fill in all fields</div>`;
    return;
  }

  try {
    const order = await apiFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: state.cart,
        shipping: { address, city, zip, name: state.user.name, email: state.user.email },
        payment: { last4: card.replace(/\s/g,'').slice(-4) },
      }),
    });
    state.cart = [];
    saveCart();
    updateCartBadge();
    navigate('success', { orderId: order.id });
  } catch (e) {
    document.getElementById('checkoutError').innerHTML = `<div class="form-error">${e.message}</div>`;
  }
}

/* ── SUCCESS ── */
function renderSuccess(orderId) {
  document.getElementById('app').innerHTML = `
    <div class="success-page">
      <div class="success-card">
        <div class="success-icon">
          <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 class="success-title">Order Placed</h2>
        <div class="success-id">Order #${orderId}</div>
        <p class="success-desc">Thank you for your purchase. You'll receive a confirmation email shortly. Your order will be dispatched within 2–3 business days.</p>
        <button class="btn-primary" onclick="navigate('home')">Continue Shopping</button>
        <br><br>
        <button class="btn-ghost" onclick="navigate('orders')" style="margin-top:12px">View My Orders</button>
      </div>
    </div>`;
}

/* ── SEARCH ── */
document.getElementById('searchBtn').addEventListener('click', () => {
  const bar = document.getElementById('searchBar');
  bar.classList.toggle('hidden');
  if (!bar.classList.contains('hidden')) document.getElementById('searchInput').focus();
});

function closeSearch() {
  document.getElementById('searchBar').classList.add('hidden');
  document.getElementById('searchInput').value = '';
}

let searchTimeout;
function handleSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    closeSearch();
    if (state.currentPage !== 'home') navigate('home');
    renderHome('All', 'default', val);
  }, 300);
}

/* ── TOAST ── */
function toast(msg, type = 'success') {
  const container = document.getElementById('toast');
  const icon = type === 'success'
    ? `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    : `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.innerHTML = `<span class="toast-icon">${icon}</span>${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', async () => {
  updateCartBadge();
  await navigate('home');
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 1200);
});