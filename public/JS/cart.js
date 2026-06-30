// ============================================
// CART.JS - Complete Cart Functionality
// ============================================

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Cart.js loaded');
  
  // Initialize all add to cart buttons
  initAddToCartButtons();
  
  // Initialize cart count
  updateCartCountFromServer();
  
  // Close modal on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });
  
  // Close modal on overlay click (event delegation)
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });
});

// ===== INIT ADD TO CART BUTTONS =====
function initAddToCartButtons() {
  var addToCartBtns = document.querySelectorAll('.add-to-cart');
  console.log('🔍 Found ' + addToCartBtns.length + ' Add to Cart buttons');
  
  addToCartBtns.forEach(function(btn, index) {
    // Remove existing listeners to prevent duplicates
    btn.removeEventListener('click', handleAddToCart);
    btn.addEventListener('click', handleAddToCart);
  });
}

// ===== HANDLE ADD TO CART CLICK =====
function handleAddToCart(e) {
  e.preventDefault();
  e.stopPropagation();
  
  var btn = this;
  console.log('🖱️ Add to Cart button clicked');
  
  // Get data from button
  var serviceId = btn.dataset.serviceId;
  var serviceName = btn.dataset.serviceName;
  var categorySlug = btn.dataset.categorySlug;
  var serviceSlug = btn.dataset.serviceSlug;
  var image = btn.dataset.image || '';
  var price = btn.dataset.price || 0;
  
  console.log('📦 Button Data:', { serviceId, serviceName, price });
  
  // Validation
  if (!serviceId || serviceId === 'undefined' || serviceId === '') {
    showToast('❌ Service ID missing! Please refresh and try again.', 'error');
    return;
  }
  
  if (!price || price === 'undefined' || price === 0 || price === '0') {
    showToast('❌ Price is invalid! Please contact support.', 'error');
    return;
  }
  
  // Show modal with service data
  showQuantityModal({
    serviceId: serviceId,
    serviceName: serviceName || 'Service',
    categorySlug: categorySlug || '',
    serviceSlug: serviceSlug || '',
    image: image,
    price: parseFloat(price) || 0,
    buttonElement: btn // Store reference for later use
  });
}

// ===== SHOW QUANTITY MODAL =====
function showQuantityModal(data) {
  console.log('📦 Showing modal for:', data.serviceName);
  
  // Check if modal already exists
  var existingModal = document.getElementById('quantityModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'quantityModal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  overlay.innerHTML = `
    <div class="modal-box" style="
      background: white;
      border-radius: 16px;
      padding: 30px;
      max-width: 420px;
      width: 100%;
      animation: modalIn 0.3s ease;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
    ">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div>
          <h5 style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
            Add ${data.serviceName}
          </h5>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #6c757d;">
            ₹${data.price}/hour
          </p>
        </div>
        <button onclick="closeModal()" style="
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
          padding: 0 5px;
          line-height: 1;
          transition: color 0.2s;
        " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#999'">&times;</button>
      </div>
      
      <!-- Form Fields -->
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #333;">
          Duration (hours)
        </label>
        <input type="number" id="duration" class="form-control" value="1" min="1" max="8" 
               style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 16px; transition: border-color 0.2s;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #333;">
          Quantity
        </label>
        <input type="number" id="quantity" class="form-control" value="1" min="1" max="10" 
               style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 16px; transition: border-color 0.2s;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #333;">
          Special Notes
        </label>
        <textarea id="notes" class="form-control" rows="2" placeholder="Any special requirements..." 
                  style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 14px; resize: vertical; transition: border-color 0.2s;"></textarea>
      </div>
      
      <!-- Total Price Display -->
      <div style="
        background: #f8f9fa;
        padding: 12px 16px;
        border-radius: 10px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <span style="font-weight: 500; color: #495057;">Total:</span>
        <span id="totalPriceDisplay" style="font-size: 20px; font-weight: 700; color: #007bff;">
          ₹${(data.price * 1 * 1).toFixed(2)}
        </span>
      </div>
      
      <!-- Buttons -->
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="closeModal()" style="
          padding: 12px 30px;
          background: #f8f9fa;
          color: #333;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        " onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
          Cancel
        </button>
        <button onclick="confirmAddToCart()" id="confirmAddBtn" style="
          padding: 12px 30px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        " onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
          Add to Cart
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  window._cartData = data;
  
  // Add event listeners for real-time total calculation
  var durationInput = document.getElementById('duration');
  var quantityInput = document.getElementById('quantity');
  
  function updateTotal() {
    var duration = parseInt(durationInput.value) || 1;
    var quantity = parseInt(quantityInput.value) || 1;
    var total = data.price * duration * quantity;
    document.getElementById('totalPriceDisplay').textContent = '₹' + total.toFixed(2);
  }
  
  durationInput.addEventListener('input', updateTotal);
  quantityInput.addEventListener('input', updateTotal);
  
  // Focus first input
  setTimeout(function() {
    durationInput.focus();
    durationInput.select();
  }, 100);
}

// ===== CONFIRM ADD TO CART =====
function confirmAddToCart() {
  console.log('✅ Confirm Add to Cart clicked');
  
  // Get values from form
  var durationInput = document.getElementById('duration');
  var quantityInput = document.getElementById('quantity');
  var notesInput = document.getElementById('notes');
  
  var duration = durationInput ? durationInput.value : 1;
  var quantity = quantityInput ? quantityInput.value : 1;
  var notes = notesInput ? notesInput.value : '';
  var data = window._cartData;
  
  console.log('📦 Data from modal:', data);
  
  if (!data || !data.serviceId) {
    showToast('❌ Invalid service data!', 'error');
    return;
  }
  
  // Validate inputs
  var durationNum = parseInt(duration) || 1;
  var quantityNum = parseInt(quantity) || 1;
  
  if (durationNum < 1 || durationNum > 8) {
    showToast('❌ Duration must be between 1 and 8 hours', 'error');
    return;
  }
  
  if (quantityNum < 1 || quantityNum > 10) {
    showToast('❌ Quantity must be between 1 and 10', 'error');
    return;
  }
  
  var payload = {
    serviceId: data.serviceId,
    serviceName: data.serviceName || 'Unknown Service',
    categorySlug: data.categorySlug || '',
    serviceSlug: data.serviceSlug || '',
    image: data.image || '',
    price: data.price || 0,
    duration: durationNum,
    quantity: quantityNum,
    notes: notes.trim() || ''
  };
  
  console.log('📤 Sending payload:', payload);
  
  // Show loading state
  var btn = document.getElementById('confirmAddBtn');
  var originalText = btn ? btn.textContent : 'Add to Cart';
  if (btn) {
    btn.textContent = '⏳ Adding...';
    btn.disabled = true;
  }
  
  // Send to server
  fetch('/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(function(response) {
    console.log('📥 Response status:', response.status);
    if (!response.ok) {
      throw new Error('Server responded with status: ' + response.status);
    }
    return response.json();
  })
  .then(function(result) {
    console.log('📥 Response data:', result);
    
    if (result.success) {
      console.log('✅ Add to cart successful');
      showToast('✅ ' + (result.message || 'Added to cart successfully!'), 'success');
      updateCartCount(result.cartCount);
      closeModalSmooth(); // Close modal with animation
      
      // Dispatch custom event for other components
      document.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { count: result.cartCount }
      }));
    } else {
      showToast('❌ ' + (result.error || 'Error adding to cart'), 'error');
    }
  })
  .catch(function(error) {
    console.error('❌ Fetch error:', error);
    showToast('❌ Network error. Please try again.', 'error');
  })
  .finally(function() {
    // Reset button
    if (btn) {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

// ===== CLOSE MODAL (Immediate) =====
function closeModal() {
  console.log('🔄 closeModal() called');
  var modal = document.getElementById('quantityModal');
  if (modal) {
    modal.remove();
    window._cartData = null;
  }
}

// ===== CLOSE MODAL SMOOTH (With Animation) =====
function closeModalSmooth() {
  console.log('🔄 closeModalSmooth() called');
  var modal = document.getElementById('quantityModal');
  
  if (modal) {
    // Add closing class for animation
    modal.classList.add('closing');
    
    // Apply animation styles
    var modalBox = modal.querySelector('.modal-box');
    if (modalBox) {
      modalBox.style.animation = 'modalOut 0.3s ease forwards';
    }
    
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';
    
    setTimeout(function() {
      if (modal && modal.parentElement) {
        modal.remove();
      }
      window._cartData = null;
    }, 350);
  } else {
    window._cartData = null;
  }
}

// ===== UPDATE CART COUNT =====
function updateCartCount(count) {
  var badge = document.getElementById('cartCount');
  if (badge) {
    badge.textContent = count || 0;
    badge.style.display = (count && count > 0) ? 'inline-flex' : 'none';
  }
}

// ===== UPDATE CART COUNT FROM SERVER =====
function updateCartCountFromServer() {
  fetch('/cart/count')
    .then(function(response) {
      if (!response.ok) throw new Error('Failed to fetch cart count');
      return response.json();
    })
    .then(function(data) {
      if (data && data.count !== undefined) {
        updateCartCount(data.count);
      }
    })
    .catch(function(error) {
      console.error('Error fetching cart count:', error);
    });
}

// ===== SHOW TOAST NOTIFICATION =====
function showToast(message, type) {
  // Remove existing toasts
  var existingToasts = document.querySelectorAll('.toast-item');
  existingToasts.forEach(function(toast) {
    toast.remove();
  });
  
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      max-width: 380px;
      width: 100%;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  var toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.style.cssText = `
    background: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    border-left: 4px solid ${type === 'success' ? '#28a745' : '#dc3545'};
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: auto;
  `;
  
  var icon = type === 'success' ? '✅' : '❌';
  var borderColor = type === 'success' ? '#28a745' : '#dc3545';
  
  toast.innerHTML = `
    <span style="font-size: 20px; flex-shrink: 0;">${icon}</span>
    <span style="flex: 1; font-size: 14px; color: #333; line-height: 1.4;">${message}</span>
    <button onclick="this.parentElement.remove()" style="
      background: none;
      border: none;
      font-size: 22px;
      cursor: pointer;
      color: #999;
      padding: 0 5px;
      flex-shrink: 0;
    ">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(function() {
    toast.style.transform = 'translateX(0)';
  });
  
  // Auto-remove after 4 seconds
  setTimeout(function() {
    toast.style.transform = 'translateX(120%)';
    setTimeout(function() {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 400);
  }, 4000);
}

// ===== ADD CSS ANIMATIONS =====
(function addStyles() {
  var style = document.createElement('style');
  style.textContent = `
    @keyframes modalIn {
      from {
        transform: scale(0.8) translateY(-20px);
        opacity: 0;
      }
      to {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes modalOut {
      from {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
      to {
        transform: scale(0.8) translateY(-20px);
        opacity: 0;
      }
    }
    
    .modal-overlay {
      animation: modalIn 0.3s ease-out;
    }
    
    .modal-overlay.closing {
      animation: modalOut 0.3s ease-in forwards;
    }
    
    .modal-box input:focus,
    .modal-box textarea:focus {
      outline: none;
      border-color: #007bff !important;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }
    
    .modal-box input[type="number"]::-webkit-inner-spin-button,
    .modal-box input[type="number"]::-webkit-outer-spin-button {
      opacity: 1;
    }
    
    /* Scrollbar styling */
    .modal-box::-webkit-scrollbar {
      width: 6px;
    }
    
    .modal-box::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    .modal-box::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
    }
    
    .modal-box::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    
    @media (max-width: 480px) {
      .modal-box {
        padding: 20px !important;
        margin: 10px;
      }
      
      .toast-container {
        top: 10px !important;
        right: 10px !important;
        left: 10px !important;
        max-width: 100% !important;
        width: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
})();

// ===== EXPOSE FUNCTIONS GLOBALLY =====
window.showQuantityModal = showQuantityModal;
window.confirmAddToCart = confirmAddToCart;
window.closeModal = closeModal;
window.closeModalSmooth = closeModalSmooth;
window.showToast = showToast;
window.updateCartCount = updateCartCount;