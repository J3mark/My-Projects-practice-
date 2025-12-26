// Require login
auth.requireLogin();

// Display user info
const currentUser = auth.getCurrentUser();
document.getElementById('userName').textContent = currentUser.username;

// Show admin link if admin
if (auth.isAdmin()) {
  document.getElementById('adminLink').style.display = 'block';
}

// Apply theme
function applyTheme() {
  // Check localStorage first for most recent theme
  let theme = null;
  const cachedTheme = localStorage.getItem('cafeTheme');
  if (cachedTheme) {
    theme = JSON.parse(cachedTheme);
  } else {
    theme = db.getTheme();
  }
  
  if (theme && Object.keys(theme).length > 0) {
    if (theme.primaryColor) document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    if (theme.secondaryColor) document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    if (theme.siteName) document.getElementById('siteName').textContent = theme.siteName;
  }
}

// Listen for theme changes from other tabs
window.addEventListener('storage', function(e) {
  if (e.key === 'cafeTheme') {
    applyTheme();
  }
});

// Update cart count
function updateCartCount() {
  const cart = localStorage.getItem('cart');
  const cartItems = cart ? JSON.parse(cart) : [];
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

// Show message helper
function showMessage(text, type = 'success') {
  const messageDiv = document.getElementById('message');
  if (!messageDiv) return;
  messageDiv.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
  setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
}

// Clear order history for current user (with confirmation)
function clearOrderHistory() {
  if (!confirm('Are you sure you want to clear your order history? This cannot be undone.')) return;
  db.deleteOrdersByUserId(currentUser.id);
  showMessage('Order history cleared.', 'success');
  displayOrders();
}

// Display user orders
function displayOrders() {
  const orders = db.getOrdersByUserId(currentUser.id);
  const ordersDiv = document.getElementById('ordersList');
  
  if (orders.length === 0) {
    ordersDiv.innerHTML = '<p>You have no orders yet. <a href="menu.html">Start your order!</a></p>';
    return;
  }
  
  ordersDiv.innerHTML = orders.reverse().map(order => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <strong>Order #${order.id}</strong>
          <p>Date: ${new Date(order.date).toLocaleString()}</p>
          <p>Status: <span class="status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
        </div>
        <div>
          <strong>Total: ₱${order.total.toFixed(2)}</strong>
        </div>
      </div>
      <div class="order-items">
        <strong>Items:</strong>
        ${order.items.map(item => `
          <div class="order-item">
            ${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Initialize
applyTheme();
updateCartCount();
displayOrders();



