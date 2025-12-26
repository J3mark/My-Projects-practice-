// Require login
auth.requireLogin();

// Display user info
const currentUser = auth.getCurrentUser();
document.getElementById('userName').textContent = currentUser.username;

// Show admin link if admin
if (auth.isAdmin()) {
  document.getElementById('adminLink').style.display = 'block';
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `✓ ${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
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
}

// Update cart count
function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
}

// Add to cart with temperature option
function addToCart(product, temperature = null) {
  const cart = getCart();
  
  // Create unique ID that includes temperature if applicable
  const itemId = temperature ? `${product.id}-${temperature}` : product.id;
  const displayName = temperature ? `${product.name} (${temperature})` : product.name;
  
  // Get price based on temperature
  let price = product.price;
  if (temperature && product.hasTemperature) {
    if (temperature === 'Hot' && product.priceHot) {
      price = product.priceHot;
    } else if (temperature === 'Cold' && product.priceCold) {
      price = product.priceCold;
    }
  }
  
  const existingItem = cart.find(item => item.itemId === itemId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      itemId: itemId,
      name: displayName,
      price: price,
      quantity: 1,
      temperature: temperature
    });
  }
  
  saveCart(cart);
  showToast('Item added to cart!', 'success');
  
  // Animate the add to cart button
  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach(btn => {
    if (btn.dataset.productId == product.id) {
      btn.classList.add('pulse');
      setTimeout(() => btn.classList.remove('pulse'), 600);
    }
  });
}

// Show temperature selection modal
function showTemperatureModal(product) {
  const hotPrice = product.priceHot || product.price || 0;
  const coldPrice = product.priceCold || product.price || 0;
  
  const modal = document.createElement('div');
  modal.className = 'temperature-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Select Temperature</h3>
      <div class="temperature-options">
        <button class="temp-btn" onclick="selectTemperature('${product.id}', 'Hot')">
          🔥 Hot<br><span class="temp-price">₱${hotPrice.toFixed(2)}</span>
        </button>
        <button class="temp-btn" onclick="selectTemperature('${product.id}', 'Cold')">
          🧊 Cold<br><span class="temp-price">₱${coldPrice.toFixed(2)}</span>
        </button>
      </div>
      <button class="close-btn" onclick="closeTemperatureModal()">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Store product data temporarily
  window.tempProduct = product;
}

function selectTemperature(productId, temperature) {
  const products = db.getProducts();
  const product = products.find(p => p.id == productId);
  if (product) {
    addToCart(product, temperature);
    closeTemperatureModal();
  }
}

function closeTemperatureModal() {
  const modal = document.querySelector('.temperature-modal');
  if (modal) {
    modal.remove();
  }
  window.tempProduct = null;
}

// Show message
function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
  setTimeout(() => {
    messageDiv.innerHTML = '';
  }, 3000);
}

// Display products
function displayProducts() {
  const products = db.getProducts();
  const productsGrid = document.getElementById('productsGrid');
  
  if (products.length === 0) {
    productsGrid.innerHTML = '<p>No products available.</p>';
    return;
  }
  
  // Group products by category
  const groupedProducts = products
    .filter(product => product.available)
    .reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});
  
  let html = '';
  for (const [category, categoryProducts] of Object.entries(groupedProducts)) {
    html += `<h2 class="category-title">${category}</h2>`;
    html += '<div class="products-grid-category">';
    html += categoryProducts.map(product => {
      const productJson = JSON.stringify(product).replace(/"/g, '&quot;');
      const hasTemp = product.hasTemperature === true;
      const addButton = hasTemp 
        ? `<button class="add-to-cart" data-product-id="${product.id}" onclick="showTemperatureModal(${productJson})">Add to Cart</button>`
        : `<button class="add-to-cart" data-product-id="${product.id}" onclick="addToCart(${productJson})">Add to Cart</button>`;
      
      // Display price based on whether it has temperature options
      let priceDisplay = '';
      if (hasTemp && product.priceHot && product.priceCold) {
        priceDisplay = `<p class="product-price">₱${product.priceHot.toFixed(2)} (Hot) / ₱${product.priceCold.toFixed(2)} (Cold)</p>`;
      } else {
        const price = product.price || product.priceHot || product.priceCold || 0;
        priceDisplay = `<p class="product-price">₱${price.toFixed(2)}</p>`;
      }
      
      return `
        <div class="product-card">
          <img src="${product.image}" alt="${product.name}" class="product-image">
          <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            ${priceDisplay}
            ${addButton}
          </div>
        </div>
      `;
    }).join('');
    html += '</div>';
  }
  
  productsGrid.innerHTML = html;
}

// Initialize
applyTheme();
displayProducts();
updateCartCount();