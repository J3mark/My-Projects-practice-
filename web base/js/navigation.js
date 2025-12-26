// Navigation helper to set active link based on current page
(function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Set active class on current page link
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();



