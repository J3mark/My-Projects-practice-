// Authentication functions
class Auth {
  constructor() {
    this.currentUserKey = 'currentUser';
  }

  // Register new user
  signup(username, email, password) {
    // Check if user already exists
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }

    // Create new user
    const newUser = db.addUser({
      username,
      email,
      password // In production, hash this!
    });

    return { success: true, message: 'Registration successful!', user: newUser };
  }

  // Login user
  login(email, password) {
    const user = db.getUserByEmail(email);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password' };
    }

    // Save current user
    this.setCurrentUser(user);
    return { success: true, message: 'Login successful!', user };
  }

  // Logout
  logout() {
    // If called without force, show custom confirmation modal
    const args = Array.from(arguments);
    const force = args[0] === true;
    if (!force) {
      this.showLogoutModal();
      return;
    }

    localStorage.removeItem(this.currentUserKey);
    window.location.href = 'login.html';
  }

  // Show a custom modal dialog for logout confirmation
  showLogoutModal() {
    if (document.getElementById('logout-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'logout-modal';
    modal.className = 'custom-modal';
    modal.innerHTML = `
      <div class="custom-modal-backdrop"></div>
      <div class="custom-modal-content" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
        <h3 id="logout-modal-title">Confirm Logout</h3>
        <p>Are you sure you want to log out?</p>
        <div class="custom-modal-actions">
          <button class="btn cancel-btn" id="logout-cancel">Cancel</button>
          <button class="btn confirm-btn" id="logout-confirm">Log Out</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const removeModal = () => {
      const m = document.getElementById('logout-modal');
      if (m) m.remove();
    };

    document.getElementById('logout-cancel').addEventListener('click', () => {
      removeModal();
    });

    document.getElementById('logout-confirm').addEventListener('click', () => {
      removeModal();
      this.logout(true);
    });
  }

  // Get current logged-in user
  getCurrentUser() {
    const userStr = localStorage.getItem(this.currentUserKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Set current user
  setCurrentUser(user) {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  // Check if user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  // Require login for page
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }

  // Require admin for page
  requireAdmin() {
    if (!this.isAdmin()) {
      alert('Access denied. Admin only.');
      window.location.href = 'menu.html';
    }
  }
}

// Export instance
const auth = new Auth();