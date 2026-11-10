'use strict';

// ==========================================
// 1. CART STATE
// ==========================================
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem('rnswatch_cart') || '[]');
  if (!Array.isArray(cart)) cart = [];
} catch (e) { cart = []; }

function saveCart() {
  localStorage.setItem('rnswatch_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(id, name, price) {
  try {
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ id, name, price, qty: 1 });
    saveCart();
    showToast(`"${name}" added to cart!`, 'success');
  } catch (e) { console.error('Cart error:', e); }
}

// ==========================================
// 2. TOAST NOTIFICATION
// ==========================================
function showToast(message, type = 'success') {
  let toast = document.getElementById('rns-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'rns-toast';
    toast.style.cssText = `position: fixed; top: 100px; right: 24px; z-index: 9999; background: ${type === 'success' ? '#2E7D32' : '#C62828'}; color: white; padding: 14px 20px; border-radius: 6px; font-family: Inter, sans-serif; font-size: 14px; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.2); opacity: 0; transform: translateX(100px); transition: all 0.3s ease; max-width: 320px;`;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = type === 'success' ? '#2E7D32' : '#C62828';
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; }, 3000);
}

// ==========================================
// 3. CHECKOUT & ORDER LOGIC
// ==========================================
function processCheckout(e) {
  if (e) e.preventDefault();

  const fullName = document.getElementById('checkoutName')?.value.trim() || '';
  const phone = document.getElementById('checkoutPhone')?.value.trim() || '';
  const address = document.getElementById('checkoutAddress')?.value.trim() || '';
  const payEl = document.querySelector('input[name="pay"]:checked');
  const paymentMethod = payEl ? payEl.value : 'Credit Card';

  if (cart.length === 0) return showToast('Your cart is empty!', 'error');
  if (!fullName || !phone || !address) return showToast('Please fill in all delivery details.', 'error');
  if (!/^[0-9+\-\s()]{7,}$/.test(phone)) return showToast('Please enter a valid phone number.', 'error');

  const placeBtn = document.querySelector('#cStep3 .btn-primary');
  if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Processing…'; }

  const orderNum = 'RS-' + Math.floor(10000 + Math.random() * 90000);
  const orderDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  let orders = JSON.parse(localStorage.getItem('rnswatch_orders') || '[]');
  orders.unshift({
    orderNum, date: orderDate, items: cart, total: total.toFixed(2),
    name: fullName, phone, address, payment: paymentMethod, status: 'Processing',
    user: getCurrentUser()?.email || 'guest'
  });
  localStorage.setItem('rnswatch_orders', JSON.stringify(orders));

  document.getElementById('checkoutStepper')?.classList.add('hidden');
  document.getElementById('cStep1')?.classList.add('hidden');
  document.getElementById('cStep2')?.classList.add('hidden');
  document.getElementById('cStep3')?.classList.add('hidden');
  document.getElementById('cStep4')?.classList.remove('hidden');
  const orderEl = document.getElementById('orderNumber');
  if (orderEl) orderEl.textContent = orderNum;

  cart = [];
  saveCart();
  showToast('Order placed successfully!');
}

function goStep(n) {
  document.querySelectorAll('.checkout-step').forEach(el => el.classList.add('hidden'));
  document.getElementById('cStep' + n)?.classList.remove('hidden');

  for (let i = 1; i <= 3; i++) {
    const nav = document.getElementById('stepNav' + i);
    if (!nav) continue;
    const circle = nav.querySelector('div');
    if (!circle) continue;
    if (i < n) {
      circle.style.background = 'var(--success)';
      circle.style.color = 'white';
      circle.style.borderColor = 'var(--success)';
    } else if (i === n) {
      circle.style.background = 'var(--gold)';
      circle.style.color = 'var(--black)';
      circle.style.borderColor = 'var(--gold)';
    } else {
      circle.style.background = 'var(--white)';
      circle.style.color = 'var(--medium-gray)';
      circle.style.borderColor = 'var(--border)';
    }
  }

  if (n === 3 && typeof populateReview === 'function') populateReview();
  window.scrollTo({ top: document.getElementById('checkoutSection')?.offsetTop || 0, behavior: 'smooth' });
}

// ==========================================
// 4. USER SESSION
// ==========================================
function getUsers() {
  try {
    const list = JSON.parse(localStorage.getItem('rnswatch_users') || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function saveUsers(list) {
  localStorage.setItem('rnswatch_users', JSON.stringify(list));
}

function getCurrentUser() {
  const email = localStorage.getItem('rnswatch_session');
  if (!email) return null;
  return getUsers().find(u => u.email === email) || null;
}

function setCurrentUser(email) {
  if (email) localStorage.setItem('rnswatch_session', email);
  else localStorage.removeItem('rnswatch_session');
}

// ==========================================
// 5. AUTH
// ==========================================
function loginUser(e) {
  if (e) e.preventDefault();

  const email = (document.getElementById('logEmail')?.value || '').trim().toLowerCase();
  const pass  = document.getElementById('logPass')?.value || '';

  if (!email || !pass) return showToast('Please enter email and password.', 'error');

  const user = getUsers().find(u => u.email === email && u.password === pass);
  if (!user) return showToast('Invalid email or password.', 'error');

  setCurrentUser(user.email);
  showToast('Login successful!');
  setTimeout(() => { window.location.href = 'account.html'; }, 500);
}

function registerUser(e) {
  if (e) e.preventDefault();

  const name    = (document.getElementById('regName')?.value || '').trim();
  const email   = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
  const pass    = (document.getElementById('regPass')?.value || '');
  const phone   = (document.getElementById('regPhone')?.value || '').trim();
  const address = (document.getElementById('regAddress')?.value || '').trim();
  const confirm = document.getElementById('regPassConfirm')?.value || '';

  if (!name || !email || !pass || !phone || !address) {
    return showToast('Please fill in all fields.', 'error');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showToast('Please enter a valid email address.', 'error');
  }
  if (pass.length < 6) {
    return showToast('Password must be at least 6 characters.', 'error');
  }
  if (confirm && confirm !== pass) {
    return showToast('Passwords do not match.', 'error');
  }

  const users = getUsers();
  if (users.some(u => u.email === email)) {
    return showToast('That email is already registered.', 'error');
  }

  users.push({ name, email, password: pass, phone, address });
  saveUsers(users);

  // ❌ TANGGALIN: setCurrentUser(email);  — hindi auto-login

  // ✅ BAGUHIN: redirect sa login.html, hindi account.html
  showToast('Account created! Please log in.');
  setTimeout(() => { window.location.href = 'login.html'; }, 800);
}

// ==========================================
// 6. ACCOUNT PAGE HELPERS
// ==========================================
function switchTab(tab, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const target = document.getElementById('tab-' + tab);
  if (target) target.classList.add('active');

  document.querySelectorAll('.account-menu a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');

  if (tab === 'details') fillProfileForm();
  if (tab === 'repairs') renderRepairs();
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'orders' && typeof renderOrders === 'function') renderOrders();
}

function fillProfileForm() {
  const u = getCurrentUser();
  if (!u) return;
  const n = document.getElementById('profName');
  const e = document.getElementById('profEmail');
  const p = document.getElementById('profPhone');
  const a = document.getElementById('profAddress');
  if (n) n.value = u.name || '';
  if (e) e.value = u.email || '';
  if (p) p.value = u.phone || '';
  if (a) a.value = u.address || '';
}

function saveProfile(e) {
  if (e) e.preventDefault();
  const current = getCurrentUser();
  if (!current) {
    showToast('Please log in first.', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 600);
    return;
  }

  const name    = (document.getElementById('profName')?.value || '').trim();
  const phone   = (document.getElementById('profPhone')?.value || '').trim();
  const address = (document.getElementById('profAddress')?.value || '').trim();

  const users = getUsers();
  const idx = users.findIndex(u => u.email === current.email);
  if (idx === -1) return showToast('User not found.', 'error');

  users[idx].name = name || users[idx].name;
  users[idx].phone = phone;
  users[idx].address = address;
  saveUsers(users);

  renderAccountHeader();
  showToast('Profile updated!');
}

function logoutUser() {
  setCurrentUser(null);
  showToast('Logged out.');
  setTimeout(() => { window.location.href = 'index.html'; }, 400);
}

function renderAccountHeader() {
  const u = getCurrentUser();
  const nameEl = document.getElementById('acctName');
  const emailEl = document.getElementById('acctEmail');
  const avatarEl = document.getElementById('acctAvatar');
  if (!nameEl || !emailEl) return;

  if (!u) {
    nameEl.textContent = 'Guest';
    emailEl.textContent = 'Not logged in';
    if (avatarEl) avatarEl.textContent = '?';
    return;
  }
  nameEl.textContent = u.name || 'User';
  emailEl.textContent = u.email;
  if (avatarEl) avatarEl.textContent = (u.name || 'U').trim().charAt(0).toUpperCase();
}

// ==========================================
// 7. REPAIRS
// ==========================================
function getRepairs() {
  try {
    const list = JSON.parse(localStorage.getItem('rnswatch_repairs') || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function renderRepairs() {
  const container = document.getElementById('repairsList');
  if (!container) return;

  const u = getCurrentUser();
  const repairs = getRepairs().filter(r => !u || r.user === u.email || r.user === 'guest');

  if (!repairs.length) {
    container.innerHTML = `<div class="card text-center" style="padding:40px;">
      <p style="color:var(--medium-gray);margin-bottom:16px;">No repairs yet.</p>
      <a href="repair.html" class="btn btn-primary">Book a Repair</a>
    </div>`;
    return;
  }

  container.innerHTML = repairs.map(r => `
    <div class="card mb-4">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <p style="font-size:13px;color:var(--medium-gray);">TICKET NUMBER</p>
          <h3 style="color:var(--gold);font-size:20px;">${r.ticket}</h3>
        </div>
        <span class="badge badge-gold">● ${r.status}</span>
      </div>
      <div class="mt-4">
        <p style="font-size:14px;"><strong>Watch:</strong> ${r.brand} ${r.model}</p>
        <p style="font-size:14px;"><strong>Service:</strong> ${r.issue}</p>
        <p style="font-size:13px;color:var(--medium-gray);margin-top:4px;">Submitted: ${r.date}</p>
      </div>
      <a href="track.html?ticket=${encodeURIComponent(r.ticket)}" class="btn btn-primary mt-4">Track Repair</a>
    </div>
  `).join('');
}

function renderDashboard() {
  const container = document.getElementById('dashboardActiveRepair');
  if (!container) return;

  const u = getCurrentUser();
  const repairs = getRepairs().filter(r => !u || r.user === u.email || r.user === 'guest');
  const active = repairs.find(r => r.status !== 'Ready') || repairs[0];

  if (!active) {
    container.innerHTML = `
      <div class="card text-center" style="padding:40px;">
        <p style="color:var(--medium-gray);margin-bottom:16px;">No active repairs right now.</p>
        <a href="repair.html" class="btn btn-primary">Book a Repair</a>
      </div>`;
    return;
  }

  const STATUS_STEPS = ['Received', 'Diagnosed', 'Awaiting Parts', 'In Progress', 'QC', 'Ready'];
  const idx = STATUS_STEPS.indexOf(active.status);
  const safeIdx = idx === -1 ? 0 : idx;
  const pct = Math.round(((safeIdx + 1) / STATUS_STEPS.length) * 100);

  container.innerHTML = `
    <div class="card mb-4">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <h3 style="font-size:18px; font-family:var(--sans);">Active Repair Progress</h3>
        <span class="badge badge-gold">● ${active.status}</span>
      </div>
      <div class="mt-4">
        <p style="font-size:14px; font-weight:600;">Ticket #${active.ticket}</p>
        <p style="font-size:14px; color:var(--medium-gray);">${active.brand} ${active.model} — ${active.issue}</p>
        <div style="width:100%; height:8px; background:var(--border); border-radius:4px; margin-top:16px;">
          <div style="width:${pct}%; height:100%; background:var(--gold); border-radius:4px; transition:width 0.4s;"></div>
        </div>
        <p style="font-size:13px; color:var(--medium-gray); margin-top:8px;">${pct}% complete</p>
      </div>
      <a href="track.html?ticket=${encodeURIComponent(active.ticket)}" class="btn btn-primary mt-4">View Details</a>
    </div>
  `;
}

// ==========================================
// 8. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  if (document.body.dataset.page === 'account') {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = 'login.html';
      return;
    }
    renderAccountHeader();
    fillProfileForm();
    renderDashboard();
    renderRepairs();
    if (typeof renderOrders === 'function') renderOrders();
  }

  const loginLink = document.getElementById('nav-login');
  const accountLink = document.getElementById('nav-logout');
  if (loginLink && accountLink) {
    const loggedIn = !!getCurrentUser();
    loginLink.style.display = loggedIn ? 'none' : 'block';
    accountLink.style.display = loggedIn ? 'block' : 'none';
  }
});

window.addEventListener('storage', updateCartBadge);

// ==========================================
// PWA — Service Worker Registration
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.warn('SW registration failed:', err));
  });
}