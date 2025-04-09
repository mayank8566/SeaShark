// Explore Models Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Model selection functionality
  const modelButtons = document.querySelectorAll('.model-select-btn:not(.premium-btn)');
  
  modelButtons.forEach(button => {
    button.addEventListener('click', function() {
      const isActive = this.classList.contains('active');
      
      // If already active, do nothing
      if (isActive) return;
      
      // Remove active class from all buttons
      modelButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.innerHTML = '<i class="fas fa-check"></i><span>Select</span>';
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      this.innerHTML = '<i class="fas fa-check-circle"></i><span>Current Model</span>';
      
      // Get model name from parent card
      const modelCard = this.closest('.model-card');
      const modelName = modelCard.querySelector('.model-name').textContent;
      
      // Show confirmation toast
      showToast(`Model switched to ${modelName}`);
    });
  });
  
  // Premium model buttons
  const premiumButtons = document.querySelectorAll('.premium-btn');
  
  premiumButtons.forEach(button => {
    button.addEventListener('click', function() {
      window.location.href = 'pricing.html';
    });
  });
  
  // Mobile menu toggle
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => {
      sidebar.classList.add('visible');
      sidebarOverlay.classList.add('visible');
    });
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('visible');
      sidebarOverlay.classList.remove('visible');
    });
  }
  
  // Sidebar toggle for desktop
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('collapsed');
    });
  }
  
  // Sidebar open button
  const sidebarOpenButton = document.getElementById('sidebar-open-button');
  
  if (sidebarOpenButton) {
    sidebarOpenButton.addEventListener('click', () => {
      sidebar.classList.remove('collapsed');
    });
  }
});

// Toast notification function
function showToast(message) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-check-circle toast-icon"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add toast to the body
  document.body.appendChild(toast);
  
  // Add visible class after a small delay
  setTimeout(() => {
    toast.classList.add('visible');
  }, 10);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('visible');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .toast.visible {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  
  .toast-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .toast-icon {
    color: var(--free-color);
  }
`;
document.head.appendChild(toastStyles); 