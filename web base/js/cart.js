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

// Get cart from localStorage
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  displayCart();
}

// Update cart count
function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

// Update quantity
function updateQuantity(itemIndex, newQuantity) {
  const cart = getCart();
  
  if (itemIndex >= 0 && itemIndex < cart.length) {
    if (newQuantity <= 0) {
      removeFromCart(itemIndex);
    } else {
      cart[itemIndex].quantity = newQuantity;
      saveCart(cart);
    }
  }
}

// Remove from cart
function removeFromCart(itemIndex) {
  let cart = getCart();
  if (itemIndex >= 0 && itemIndex < cart.length) {
    cart.splice(itemIndex, 1);
    saveCart(cart);
  }
}

// Calculate total
function calculateTotal() {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Display cart
function displayCart() {
  const cart = getCart();
  const cartItemsDiv = document.getElementById('cartItems');
  const cartTotalDiv = document.getElementById('cartTotal');
  
  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    cartTotalDiv.innerHTML = '';
    return;
  }
  
  cartItemsDiv.innerHTML = cart.map((item, index) => {
    return `
    <div class="cart-item" data-item-index="${index}">
      <div>
        <h3>${item.name}</h3>
        <p>₱${item.price.toFixed(2)} each</p>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="qty-btn qty-decrease" data-item-index="${index}" 
                style="padding: 0.5rem 1rem; cursor: pointer;">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn qty-increase" data-item-index="${index}" 
                style="padding: 0.5rem 1rem; cursor: pointer;">+</button>
        <span style="font-weight: bold; margin-left: 1rem;">
          ₱${(item.price * item.quantity).toFixed(2)}
        </span>
        <button class="remove-btn" data-item-index="${index}"
                style="padding: 0.5rem 1rem; background: #dc3545; color: white; 
                       border: none; border-radius: 4px; cursor: pointer;">
          Remove
        </button>
      </div>
    </div>
    `;
  }).join('');
  
  cartTotalDiv.innerHTML = `Total: ₱${calculateTotal().toFixed(2)}`;
}

// Setup event delegation for cart buttons (only once)
function setupCartEventListeners() {
  const cartItemsContainer = document.getElementById('cartItems');
  
  cartItemsContainer.addEventListener('click', function(e) {
    e.preventDefault();
    
    if (e.target.classList.contains('qty-decrease')) {
      const itemIndex = parseInt(e.target.dataset.itemIndex);
      const cart = getCart();
      if (itemIndex >= 0 && itemIndex < cart.length) {
        updateQuantity(itemIndex, cart[itemIndex].quantity - 1);
      }
    } else if (e.target.classList.contains('qty-increase')) {
      const itemIndex = parseInt(e.target.dataset.itemIndex);
      const cart = getCart();
      if (itemIndex >= 0 && itemIndex < cart.length) {
        updateQuantity(itemIndex, cart[itemIndex].quantity + 1);
      }
    } else if (e.target.classList.contains('remove-btn')) {
      const itemIndex = parseInt(e.target.dataset.itemIndex);
      removeFromCart(itemIndex);
    }
  });
}

// Checkout
function checkout() {
  const cart = getCart();
  
  if (cart.length === 0) {
    showEmptyCartPopup();
    return;
  }
  
  const total = calculateTotal();
  const order = {
    userId: currentUser.id,
    items: cart,
    total: total
  };
  
  db.addOrder(order);
  
  // Show thank you pop-up with receipt
  showThankYouPopup(total, cart);
  
  // Clear cart after showing popup
  localStorage.removeItem('cart');
}

// Show empty cart pop-up
function showEmptyCartPopup() {
  const modal = document.createElement('div');
  modal.className = 'empty-cart-modal';
  modal.innerHTML = `
    <div class="empty-cart-content">
      <div class="empty-cart-icon">🛒</div>
      <h2>Your Cart is Empty</h2>
      <p>Oops! It looks like you haven't added anything to your cart yet.</p>
      <button class="empty-cart-btn" onclick="closeEmptyCartPopup()">
        Continue Shopping
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Close empty cart pop-up
function closeEmptyCartPopup() {
  const modal = document.querySelector('.empty-cart-modal');
  if (modal) {
    modal.remove();
  }
}

// Show thank you pop-up with receipt
function showThankYouPopup(orderTotal, cartItems) {
  const receiptHTML = cartItems.map(item => `
    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
      <div style="flex: 1;">
        <span>${item.name}</span><br>
        <span style="font-size: 0.85rem; color: #999;">₱${item.price.toFixed(2)} × ${item.quantity}</span>
      </div>
      <span style="font-weight: 600; margin-left: 1rem;">₱${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');
  
  const modal = document.createElement('div');
  modal.className = 'thank-you-modal';
  modal.innerHTML = `
    <div class="thank-you-content" style="max-width:420px; padding:1rem;">
      <div class="thank-you-icon">✓</div>
      <h2 style="margin:0.25rem 0;">Thank You!</h2>
      <p style="margin:0 0 0.5rem 0;">Your order is placed.</p>
      
      <div class="order-details" style="text-align: left; background: var(--white); border: 2px solid var(--primary-color);">
        <div style="padding: 0.6rem; border-bottom: 2px solid var(--primary-color); text-align: center; font-weight: bold; color: var(--primary-color); font-size: 1rem;">
          ORDER RECEIPT
        </div>
        
        <div style="padding: 0.6rem;">
          <div class="receipt-items" style="max-height:160px; overflow:auto;">
            ${receiptHTML}
          </div>

          <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-top: 2px solid var(--primary-color); font-size: 1rem; font-weight: bold; color: var(--primary-color);">
            <span>TOTAL:</span>
            <span>₱${orderTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <button class="thank-you-btn" onclick="closeThankYouPopup()" style="margin-top:0.75rem;">
        Order Again
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Close thank you pop-up
function closeThankYouPopup() {
  const modal = document.querySelector('.thank-you-modal');
  if (modal) {
    modal.remove();
  }
  
  // Reload page to show updated cart
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

// Initialize
applyTheme();
setupCartEventListeners();
displayCart();
updateCartCount();