// Require admin access
auth.requireAdmin();

// Display user info
const currentUser = auth.getCurrentUser();
document.getElementById('userName').textContent = currentUser.username;

// Update cart count
function updateCartCount() {
  const cart = localStorage.getItem('cart');
  const cartItems = cart ? JSON.parse(cart) : [];
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = totalItems;
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
  
  if (theme) {
    if (theme.primaryColor) document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    if (theme.secondaryColor) document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    if (theme.siteName) document.getElementById('siteName').textContent = theme.siteName;
    
    // Update form inputs
    if (document.getElementById('siteNameInput')) document.getElementById('siteNameInput').value = theme.siteName;
    if (document.getElementById('primaryColor')) document.getElementById('primaryColor').value = theme.primaryColor;
    if (document.getElementById('primaryColorText')) document.getElementById('primaryColorText').value = theme.primaryColor;
    if (document.getElementById('secondaryColor')) document.getElementById('secondaryColor').value = theme.secondaryColor;
    if (document.getElementById('secondaryColorText')) document.getElementById('secondaryColorText').value = theme.secondaryColor;
  }
}

// Show message
function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
  setTimeout(() => {
    messageDiv.innerHTML = '';
  }, 3000);
}

// Switch tabs
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-btn');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`${tabName}-tab`).classList.add('active');
  event.target.classList.add('active');
  
  if (tabName === 'products') {
    displayProducts();
  } else if (tabName === 'users') {
    displayUsers();
  } else if (tabName === 'orders') {
    displayOrders();
  }
}

// Theme Functions
document.getElementById('primaryColor').addEventListener('input', (e) => {
  document.getElementById('primaryColorText').value = e.target.value;
});

document.getElementById('secondaryColor').addEventListener('input', (e) => {
  document.getElementById('secondaryColorText').value = e.target.value;
});

function saveTheme() {
  const theme = {
    siteName: document.getElementById('siteNameInput').value,
    primaryColor: document.getElementById('primaryColor').value,
    secondaryColor: document.getElementById('secondaryColor').value
  };
  
  db.updateTheme(theme);
  
  // Store theme in localStorage as well for immediate persistence across all pages
  localStorage.setItem('cafeTheme', JSON.stringify(theme));
  
  applyTheme();
  showMessage('Theme updated successfully! Changes will apply system-wide.', 'success');
}

// Reset theme to defaults from data/db.json
async function resetTheme() {
  try {
    const resp = await fetch('data/db.json');
    if (!resp.ok) throw new Error('Failed to load defaults');
    const json = await resp.json();
    const defaultTheme = json.theme || {};

    // Update database and localStorage
    db.updateTheme(defaultTheme);
    localStorage.setItem('cafeTheme', JSON.stringify(defaultTheme));

    // Update UI inputs if present
    if (document.getElementById('siteNameInput')) document.getElementById('siteNameInput').value = defaultTheme.siteName || '';
    if (document.getElementById('primaryColor')) document.getElementById('primaryColor').value = defaultTheme.primaryColor || '';
    if (document.getElementById('primaryColorText')) document.getElementById('primaryColorText').value = defaultTheme.primaryColor || '';
    if (document.getElementById('secondaryColor')) document.getElementById('secondaryColor').value = defaultTheme.secondaryColor || '';
    if (document.getElementById('secondaryColorText')) document.getElementById('secondaryColorText').value = defaultTheme.secondaryColor || '';

    applyTheme();
    showMessage('Theme reset to default values.', 'success');
  } catch (err) {
    console.error(err);
    showMessage('Unable to reset theme to defaults.', 'error');
  }
}

// Image Upload Functions
function handleImageUpload(fileInputId, previewId, urlInputId) {
  const fileInput = document.getElementById(fileInputId);
  const preview = document.getElementById(previewId);
  const urlInput = document.getElementById(urlInputId);
  
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('Image size must be less than 2MB', 'error');
      fileInput.value = '';
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error');
      fileInput.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Image = e.target.result;
      preview.innerHTML = `<img src="${base64Image}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 0.5rem;">`;
      // Store base64 in a hidden way - we'll use it when saving
      preview.setAttribute('data-base64', base64Image);
      // Clear URL input
      urlInput.value = '';
    };
    reader.readAsDataURL(file);
  }
}

function clearFileUpload(fileInputId, previewId) {
  const fileInput = document.getElementById(fileInputId);
  const preview = document.getElementById(previewId);
  if (fileInput) fileInput.value = '';
  if (preview) {
    preview.innerHTML = '';
    preview.removeAttribute('data-base64');
  }
}

// Toggle temperature price inputs
function toggleTemperaturePrices() {
  const hasTemp = document.getElementById('productHasTemperature').checked;
  const priceInputs = document.getElementById('priceInputs');
  
  if (hasTemp) {
    priceInputs.innerHTML = `
      <input type="number" id="productPriceHot" placeholder="Hot Price" step="0.01" style="margin-bottom: 0.5rem;">
      <input type="number" id="productPriceCold" placeholder="Cold Price" step="0.01">
    `;
  } else {
    priceInputs.innerHTML = `
      <input type="number" id="productPrice" placeholder="Price" step="0.01">
    `;
  }
}

function toggleEditTemperaturePrices(productId) {
  const hasTemp = document.getElementById(`edit-hasTemperature-${productId}`).checked;
  const priceInputs = document.getElementById(`edit-price-inputs-${productId}`);
  const currentHot = document.getElementById(`edit-priceHot-${productId}`)?.value || '';
  const currentCold = document.getElementById(`edit-priceCold-${productId}`)?.value || '';
  const currentPrice = document.getElementById(`edit-price-${productId}`)?.value || '';
  
  if (hasTemp) {
    priceInputs.innerHTML = `
      <input type="number" id="edit-priceHot-${productId}" value="${currentHot || currentPrice}" placeholder="Hot Price" step="0.01" style="margin-bottom: 0.5rem;">
      <input type="number" id="edit-priceCold-${productId}" value="${currentCold || currentPrice}" placeholder="Cold Price" step="0.01">
    `;
  } else {
    const singlePrice = currentHot || currentCold || currentPrice;
    priceInputs.innerHTML = `
      <input type="number" id="edit-price-${productId}" value="${singlePrice}" placeholder="Price" step="0.01">
    `;
  }
}

// Product Functions
function displayProducts() {
  const products = db.getProducts();
  const tbody = document.getElementById('productsTableBody');
  
  tbody.innerHTML = products.map(product => `
    <tr id="product-${product.id}">
      <td data-label="Image"><img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/60'"></td>
      <td data-label="Name">${product.name}</td>
      <td data-label="Category">${product.category}</td>
      <td data-label="Price">
        ${product.hasTemperature && product.priceHot && product.priceCold 
          ? `Hot: ₱${product.priceHot.toFixed(2)}<br>Cold: ₱${product.priceCold.toFixed(2)}`
          : `₱${(product.price || product.priceHot || product.priceCold || 0).toFixed(2)}`}
      </td>
      <td data-label="Available">
        <input type="checkbox" ${product.available ? 'checked' : ''} 
               onchange="toggleAvailability(${product.id}, this.checked)">
      </td>
      <td data-label="Actions">
        <button class="action-btn edit-btn" onclick="editProduct(${product.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
      </td>
    </tr>
    <tr id="edit-${product.id}" style="display: none;">
      <td colspan="6">
        <div class="edit-form">
          <input type="text" id="edit-name-${product.id}" value="${product.name}" placeholder="Name">
          <select id="edit-category-${product.id}">
            <option value="Coffee" ${product.category === 'Coffee' ? 'selected' : ''}>Coffee</option>
            <option value="Pastry" ${product.category === 'Pastry' ? 'selected' : ''}>Pastry</option>
            <option value="Side Dish" ${product.category === 'Side Dish' ? 'selected' : ''}>Side Dish</option>
          </select>
          <div id="edit-price-inputs-${product.id}">
            ${product.hasTemperature ? `
              <input type="number" id="edit-priceHot-${product.id}" value="${product.priceHot || product.price || ''}" placeholder="Hot Price" step="0.01" style="margin-bottom: 0.5rem;">
              <input type="number" id="edit-priceCold-${product.id}" value="${product.priceCold || product.price || ''}" placeholder="Cold Price" step="0.01">
            ` : `
              <input type="number" id="edit-price-${product.id}" value="${product.price || product.priceHot || product.priceCold || ''}" placeholder="Price" step="0.01">
            `}
          </div>
          <textarea id="edit-description-${product.id}" placeholder="Description">${product.description}</textarea>
          <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <input type="checkbox" id="edit-hasTemperature-${product.id}" ${product.hasTemperature ? 'checked' : ''} onchange="toggleEditTemperaturePrices(${product.id})">
            Has Hot/Cold Options
          </label>
          <div class="image-upload-section">
            <label>Product Image</label>
            <div class="image-upload-options">
              <div class="upload-option">
                <label for="edit-image-file-${product.id}" class="upload-label">
                  <input type="file" id="edit-image-file-${product.id}" accept="image/*" onchange="handleImageUpload('edit-image-file-${product.id}', 'edit-image-preview-${product.id}', 'edit-image-${product.id}')">
                  <span class="upload-btn">📷 Upload Image</span>
                </label>
                <div id="edit-image-preview-${product.id}" class="image-preview">
                  ${product.image && product.image.startsWith('data:image') ? `<img src="${product.image}" alt="Current" style="max-width: 200px; max-height: 200px; border-radius: 4px; margin-top: 0.5rem;">` : ''}
                </div>
              </div>
              <div class="upload-divider">OR</div>
              <div class="upload-option">
                <input type="url" id="edit-image-${product.id}" value="${product.image && !product.image.startsWith('data:image') ? product.image : ''}" placeholder="Image URL" onchange="clearFileUpload('edit-image-file-${product.id}', 'edit-image-preview-${product.id}')">
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button class="action-btn save-btn" onclick="saveProduct(${product.id})">Save</button>
            <button class="action-btn" onclick="cancelEdit(${product.id})" style="background: #6c757d; color: white;">Cancel</button>
          </div>
        </div>
      </td>
    </tr>
  `).join('');
}

function editProduct(id) {
  // Hide all other edit forms
  document.querySelectorAll('[id^="edit-"]').forEach(row => {
    row.style.display = 'none';
  });
  
  // Show this edit form
  document.getElementById(`edit-${id}`).style.display = 'table-row';
}

function cancelEdit(id) {
  document.getElementById(`edit-${id}`).style.display = 'none';
}

function saveProduct(id) {
  const name = document.getElementById(`edit-name-${id}`).value;
  const category = document.getElementById(`edit-category-${id}`).value;
  const description = document.getElementById(`edit-description-${id}`).value;
  const hasTemperature = document.getElementById(`edit-hasTemperature-${id}`).checked;
  
  // Get prices based on temperature option
  let price, priceHot, priceCold;
  if (hasTemperature) {
    priceHot = parseFloat(document.getElementById(`edit-priceHot-${id}`).value);
    priceCold = parseFloat(document.getElementById(`edit-priceCold-${id}`).value);
    if (!priceHot || !priceCold) {
      showMessage('Please fill both hot and cold prices', 'error');
      return;
    }
  } else {
    const priceInput = document.getElementById(`edit-price-${id}`);
    if (priceInput) {
      price = parseFloat(priceInput.value);
      if (!price) {
        showMessage('Please fill all fields', 'error');
        return;
      }
    }
  }
  
  // Check for uploaded image first, then URL
  const preview = document.getElementById(`edit-image-preview-${id}`);
  const base64Image = preview ? preview.getAttribute('data-base64') : null;
  const imageUrl = document.getElementById(`edit-image-${id}`).value;
  
  let image = base64Image || imageUrl || 'https://via.placeholder.com/300';
  
  if (!name || !category || !description) {
    showMessage('Please fill all fields', 'error');
    return;
  }
  
  const updateData = {
    name,
    category,
    description,
    image,
    hasTemperature: hasTemperature || false
  };
  
  if (hasTemperature) {
    updateData.priceHot = priceHot;
    updateData.priceCold = priceCold;
    updateData.price = null; // Remove single price if switching to temperature-based
  } else {
    updateData.price = price;
    updateData.priceHot = null; // Remove temperature prices if switching to single price
    updateData.priceCold = null;
  }
  
  db.updateProduct(id, updateData);
  
  showMessage('Product updated successfully!', 'success');
  displayProducts();
}

function addProduct() {
  const name = document.getElementById('productName').value;
  const category = document.getElementById('productCategory').value;
  const description = document.getElementById('productDescription').value;
  const hasTemperature = document.getElementById('productHasTemperature').checked;
  
  // Get prices based on temperature option
  let price, priceHot, priceCold;
  if (hasTemperature) {
    priceHot = parseFloat(document.getElementById('productPriceHot').value);
    priceCold = parseFloat(document.getElementById('productPriceCold').value);
    if (!priceHot || !priceCold) {
      showMessage('Please fill both hot and cold prices', 'error');
      return;
    }
  } else {
    price = parseFloat(document.getElementById('productPrice').value);
    if (!price) {
      showMessage('Please fill all fields', 'error');
      return;
    }
  }
  
  // Check for uploaded image first, then URL
  const preview = document.getElementById('productImagePreview');
  const base64Image = preview ? preview.getAttribute('data-base64') : null;
  const imageUrl = document.getElementById('productImage').value;
  
  let image = base64Image || imageUrl || 'https://via.placeholder.com/300';
  
  if (!name || !category || !description) {
    showMessage('Please fill all fields', 'error');
    return;
  }
  
  const product = {
    name,
    category,
    description,
    image,
    hasTemperature: hasTemperature || false
  };
  
  if (hasTemperature) {
    product.priceHot = priceHot;
    product.priceCold = priceCold;
  } else {
    product.price = price;
  }
  
  db.addProduct(product);
  showMessage('Product added successfully!', 'success');
  
  // Clear form
  document.getElementById('productName').value = '';
  document.getElementById('productCategory').value = '';
  document.getElementById('productDescription').value = '';
  document.getElementById('productImage').value = '';
  document.getElementById('productImageFile').value = '';
  document.getElementById('productHasTemperature').checked = false;
  toggleTemperaturePrices(); // Reset price inputs
  if (preview) {
    preview.innerHTML = '';
    preview.removeAttribute('data-base64');
  }
  
  displayProducts();
}

function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    db.deleteProduct(id);
    showMessage('Product deleted successfully!', 'success');
    displayProducts();
  }
}

// User management
function displayUsers() {
  const users = db.getUsers();
  const tbody = document.getElementById('usersTableBody');
  const me = auth.getCurrentUser();

  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => {
    const isMe = user.id === me.id;
    // Show password in plaintext by default per admin request
    const masked = user.password || '';
    const statusText = user.blocked ? 'Blocked' : 'Active';

    const actions = [];
    if (!isMe) {
      // role actions
      if (user.role === 'admin') {
        actions.push(`<button class="action-btn" onclick="changeUserRole(${user.id}, 'customer')">Demote</button>`);
      } else {
        actions.push(`<button class="action-btn save-btn" onclick="changeUserRole(${user.id}, 'admin')">Promote</button>`);
      }
      // block/unblock
      if (user.blocked) {
        actions.push(`<button class="action-btn" onclick="changeUserBlocked(${user.id}, false)">Unblock</button>`);
      } else {
        actions.push(`<button class="action-btn" onclick="changeUserBlocked(${user.id}, true)">Block</button>`);
      }
      // view/hide password button (default state: Hide since password is shown)
      actions.push(`<button class="action-btn" onclick="toggleShowPassword(${user.id})" id="pw-btn-${user.id}">Hide</button>`);
      // delete
      actions.push(`<button class="action-btn delete-btn" onclick="deleteUser(${user.id})">Delete</button>`);
    } else {
      actions.push('<em>Current admin</em>');
    }

    return `
      <tr id="user-${user.id}">
        <td data-label="Username">${user.username}</td>
        <td data-label="Email">${user.email}</td>
        <td data-label="Password"><span id="pw-${user.id}">${masked}</span></td>
        <td data-label="Role">${user.role}</td>
        <td data-label="Status">${statusText}</td>
        <td data-label="Actions">${actions.join(' ')}</td>
      </tr>
    `;
  }).join('');
}

function toggleShowPassword(id) {
  const span = document.getElementById(`pw-${id}`);
  const btn = document.getElementById(`pw-btn-${id}`);
  const user = db.getUsers().find(u => u.id === id);
  if (!span || !user) return;
  if (span.getAttribute('data-shown') === 'true') {
    // hide
    span.textContent = user.password ? '•'.repeat(Math.max(6, user.password.length)) : '';
    span.setAttribute('data-shown', 'false');
    btn.textContent = 'Show';
  } else {
    // show plaintext
    span.textContent = user.password || '';
    span.setAttribute('data-shown', 'true');
    btn.textContent = 'Hide';
  }
}

function changeUserBlocked(id, blocked) {
  const me = auth.getCurrentUser();
  if (id === me.id) {
    showMessage('You cannot block yourself.', 'error');
    return;
  }
  db.updateUser(id, { blocked });
  showMessage(blocked ? 'User blocked.' : 'User unblocked.', 'success');
  displayUsers();
}

function changeUserRole(id, newRole) {
  const me = auth.getCurrentUser();
  // Prevent demoting last admin
  if (newRole === 'customer') {
    const admins = db.getUsers().filter(u => u.role === 'admin');
    if (admins.length <= 1 && admins[0].id === id) {
      showMessage('Cannot remove the last admin.', 'error');
      return;
    }
  }

  db.updateUser(id, { role: newRole });
  showMessage('User role updated.', 'success');
  displayUsers();
}

function deleteUser(id) {
  const me = auth.getCurrentUser();
  if (id === me.id) {
    showMessage('You cannot delete yourself.', 'error');
    return;
  }
  const user = db.getUsers().find(u => u.id === id);
  if (!user) {
    showMessage('User not found', 'error');
    return;
  }
  if (user.role === 'admin') {
    const admins = db.getUsers().filter(u => u.role === 'admin');
    if (admins.length <= 1) {
      showMessage('Cannot delete the last admin.', 'error');
      return;
    }
  }

  if (confirm('Are you sure you want to delete this user?')) {
    db.deleteUser(id);
    showMessage('User deleted.', 'success');
    displayUsers();
  }
}

function toggleAvailability(id, available) {
  db.updateProduct(id, { available });
  showMessage('Product availability updated!', 'success');
}

// Orders Functions
function displayOrders() {
  const orders = db.getOrders();
  const ordersDiv = document.getElementById('ordersList');
  
  if (orders.length === 0) {
    ordersDiv.innerHTML = '<p>No orders yet.</p>';
    return;
  }
  
  ordersDiv.innerHTML = orders.reverse().map(order => {
    const user = db.getUserById(order.userId);
    const username = user ? user.username : 'Unknown User';
    const userEmail = user ? user.email : 'N/A';
    
    return `
    <div class="order-card">
      <div class="order-header">
        <div>
          <strong>Order #${order.id}</strong>
          <p><strong>Customer:</strong> ${username} (${userEmail})</p>
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
    `;
  }).join('');
}

// Initialize
applyTheme();
updateCartCount();
displayProducts();
displayUsers();