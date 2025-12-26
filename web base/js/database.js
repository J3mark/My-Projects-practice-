// Database handler for local storage simulation
class Database {
  constructor() {
    this.storageKey = 'cafeDB';
    this.initDatabase();
  }

  // Initialize database from JSON or localStorage
  async initDatabase() {
    const stored = localStorage.getItem(this.storageKey);
    // Check for theme in localStorage (most recent)
    const cachedTheme = localStorage.getItem('cafeTheme');
    
    try {
      const response = await fetch('../data/db.json');
      const jsonData = await response.json();
      
      if (!stored) {
        // First time: load everything from JSON
        // If we have a cached theme, use that instead of the JSON theme
        if (cachedTheme) {
          jsonData.theme = JSON.parse(cachedTheme);
        }
        this.saveToStorage(jsonData);
      } else {
        // Update products from JSON while preserving users, orders, and theme
        const currentData = JSON.parse(stored);
        // Merge products: update existing ones, add new ones
        jsonData.products.forEach(jsonProduct => {
          const existingIndex = currentData.products.findIndex(p => p.id === jsonProduct.id);
          if (existingIndex !== -1) {
            // Update existing product, preserve any custom fields
            currentData.products[existingIndex] = {
              ...currentData.products[existingIndex],
              ...jsonProduct,
              // Preserve availability if it was changed
              available: currentData.products[existingIndex].available !== undefined 
                ? currentData.products[existingIndex].available 
                : jsonProduct.available
            };
          } else {
            // Add new product
            currentData.products.push(jsonProduct);
          }
        });
        // Preserve existing users (except admin), orders, and theme
        if (jsonData.users && jsonData.users.length > 0) {
          // Keep admin user from JSON, merge other users
          const adminUser = jsonData.users.find(u => u.role === 'admin');
          if (adminUser) {
            const existingAdminIndex = currentData.users.findIndex(u => u.role === 'admin');
            if (existingAdminIndex !== -1) {
              currentData.users[existingAdminIndex] = adminUser;
            } else {
              currentData.users.unshift(adminUser);
            }
          }
        }
        // Use cached theme if available, otherwise keep existing
        if (cachedTheme) {
          currentData.theme = JSON.parse(cachedTheme);
        }
        this.saveToStorage(currentData);
      }
    } catch (error) {
      console.error('Error loading database:', error);
    }
  }

  // Get all data
  getData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  // Save data to localStorage
  saveToStorage(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Users operations
  getUsers() {
    const data = this.getData();
    return data ? data.users : [];
  }

  addUser(user) {
    const data = this.getData();
    const newUser = {
      id: Date.now(),
      ...user,
      role: 'customer'
    };
    data.users.push(newUser);
    this.saveToStorage(data);
    return newUser;
  }

  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find(user => user.email === email);
  }

  updateUser(id, updates) {
    const data = this.getData();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...updates };
      this.saveToStorage(data);
      return data.users[index];
    }
    return null;
  }

  deleteUser(id) {
    const data = this.getData();
    data.users = data.users.filter(u => u.id !== id);
    this.saveToStorage(data);
  }

  // Products operations
  getProducts() {
    const data = this.getData();
    return data ? data.products : [];
  }

  addProduct(product) {
    const data = this.getData();
    const newProduct = {
      id: Date.now(),
      ...product,
      available: product.available !== undefined ? product.available : true,
      hasTemperature: product.hasTemperature !== undefined ? product.hasTemperature : false
    };
    // Ensure price structure is correct
    if (newProduct.hasTemperature) {
      if (!newProduct.priceHot && newProduct.price) {
        newProduct.priceHot = newProduct.price;
      }
      if (!newProduct.priceCold && newProduct.price) {
        newProduct.priceCold = newProduct.price + 10; // Default cold is +10
      }
    }
    data.products.push(newProduct);
    this.saveToStorage(data);
    return newProduct;
  }

  updateProduct(id, updates) {
    const data = this.getData();
    const index = data.products.findIndex(p => p.id === id);
    if (index !== -1) {
      data.products[index] = { ...data.products[index], ...updates };
      this.saveToStorage(data);
      return data.products[index];
    }
    return null;
  }

  deleteProduct(id) {
    const data = this.getData();
    data.products = data.products.filter(p => p.id !== id);
    this.saveToStorage(data);
  }

  // Orders operations
  getOrders() {
    const data = this.getData();
    return data ? data.orders : [];
  }

  getOrdersByUserId(userId) {
    const orders = this.getOrders();
    return orders.filter(order => order.userId === userId);
  }

  // Delete all orders for a given user
  deleteOrdersByUserId(userId) {
    const data = this.getData();
    data.orders = data.orders.filter(order => order.userId !== userId);
    this.saveToStorage(data);
  }

  getUserById(userId) {
    const users = this.getUsers();
    return users.find(user => user.id === userId);
  }

  addOrder(order) {
    const data = this.getData();
    const newOrder = {
      id: Date.now(),
      ...order,
      date: new Date().toISOString(),
      status: 'pending'
    };
    data.orders.push(newOrder);
    this.saveToStorage(data);
    return newOrder;
  }

  // Theme operations
  getTheme() {
    const data = this.getData();
    return data ? data.theme : {};
  }

  updateTheme(theme) {
    const data = this.getData();
    data.theme = { ...data.theme, ...theme };
    this.saveToStorage(data);
    return data.theme;
  }
}

// Export instance
const db = new Database();