// ================================== NAVIGATION ==================================
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show selected page with animation
    const selectedPage = document.getElementById(pageId);
    selectedPage.classList.remove('hidden');
    selectedPage.classList.add('fade-in');
    
    // Remove animation class after animation completes
    setTimeout(() => {
        selectedPage.classList.remove('fade-in');
    }, 600);
    
    // Run page-specific logic
    if (pageId === 'cart') renderCart();
    if (pageId === 'checkout') updateCheckoutTotal();
}

// =============================== FIREBASE SETUP ===============================
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAywmtgbd8u2a_P82NVVwzAepKOuEibqWQ",
    authDomain: "rope-halter-rainboww.firebaseapp.com",
    projectId: "rope-halter-rainboww",
    storageBucket: "rope-halter-rainboww.firebasestorage.app",
    messagingSenderId: "626626308371",
    appId: "1:626626308371:web:3c8bf50555f2a07be692e6",
    measurementId: "G-J9H460J98N"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// =============================== DATA & STATE ===============================
const productData = {
    price: 250.00,
    nosebandColors: ['pink', 'cyan', 'green', 'purple', 'yellow'],
    cheekpieceColors: ['pink', 'cyan', 'green', 'purple', 'yellow'],
};

let currentHalterDesign = { 
    noseband: 'default', 
    cheekpieces: 'default' 
};

const colorHexMap = {
    pink: '#EC4899',
    cyan: '#06B6D4',
    green: '#10B981',
    purple: '#8B5CF6',
    yellow: '#F59E0B'
};

// ============================ SHOP PAGE LOGIC ===============================
function createColorSwatches(container, colors, part) {
    container.innerHTML = '';
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = colorHexMap[color] || color;
        swatch.onclick = () => {
            selectColor(container, swatch, part, color);
        };
        container.appendChild(swatch);
    });
}

function selectColor(container, selectedSwatch, part, color) {
    // Remove selected class from all swatches
    container.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.remove('selected');
    });
    
    // Add selected class to clicked swatch
    selectedSwatch.classList.add('selected');
    
    // Update halter design
    currentHalterDesign[part] = color;
    
    // Update halter images (if images exist)
    const imageElement = document.getElementById(`${part}-image`);
    if (imageElement) {
        imageElement.src = `images/${part}-${color}.png`;
    }
}

function addToCart() {
    const feedback = document.getElementById('cart-feedback-message');
    
    // Check if both colors are selected
    if (currentHalterDesign.noseband === 'default' || currentHalterDesign.cheekpieces === 'default') {
        showMessage(feedback, 'Please select colors for both parts!', 'error');
        return;
    }

    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    
    // Add new item to cart
    cart.push({
        id: 'customHalter_' + Date.now(),
        name: 'Custom Rope Halter',
        price: productData.price,
        design: { ...currentHalterDesign },
    });
    
    // Save cart to localStorage
    localStorage.setItem('mysticManesCart', JSON.stringify(cart));
    
    // Show success message
    showMessage(feedback, '✨ Added to your cart!', 'success');
}

// ============================= CART PAGE LOGIC ==============================
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const container = document.getElementById('cart-items-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.getElementById('cart-summary');
    
    // Clear container
    container.innerHTML = '';

    if (cart.length === 0) {
        // Show empty cart message
        emptyMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
    } else {
        // Hide empty message and show cart summary
        emptyMessage.classList.add('hidden');
        cartSummary.classList.remove('hidden');
        
        let subtotal = 0;
        
        // Render each cart item
        cart.forEach(item => {
            subtotal += item.price;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p><i class="fas fa-palette"></i> Noseband: ${capitalizeFirst(item.design.noseband)}</p>
                    <p><i class="fas fa-palette"></i> Cheek Pieces: ${capitalizeFirst(item.design.cheekpieces)}</p>
                </div>
                <div class="cart-item-price">R${item.price.toFixed(2)}</div>
                <button class="remove-btn" onclick="removeItemFromCart('${item.id}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            `;
            container.appendChild(cartItem);
        });

        // Update totals
        document.getElementById('cart-subtotal').textContent = `R${subtotal.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `R${subtotal.toFixed(2)}`;
    }
}

function removeItemFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('mysticManesCart', JSON.stringify(cart));
    renderCart();
}

// =========================== CHECKOUT PAGE LOGIC ============================
// Authentication state observer
auth.onAuthStateChanged(user => {
    const authSection = document.getElementById('auth-section');
    const checkoutSection = document.getElementById('checkout-section');
    const userEmailDisplay = document.getElementById('user-email-display');
    
    if (user) {
        authSection.classList.add('hidden');
        checkoutSection.classList.remove('hidden');
        userEmailDisplay.textContent = user.email;
    } else {
        authSection.classList.remove('hidden');
        checkoutSection.classList.add('hidden');
    }
});

function updateCheckoutTotal() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const totalElement = document.getElementById('total-payment-amount');
    if (totalElement) {
        totalElement.textContent = `R${total.toFixed(2)}`;
    }
}

// Authentication functions
function handleLogin(e) {
    e.preventDefault();
    const email = e.target['login-email'].value;
    const password = e.target['login-password'].value;
    const errorMsg = document.getElementById('auth-error-message');
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        });
}

function handleSignup(e) {
    e.preventDefault();
    const email = e.target['signup-email'].value;
    const password = e.target['signup-password'].value;
    const errorMsg = document.getElementById('auth-error-message');
    
    auth.createUserWithEmailAndPassword(email, password)
        .catch(error => {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
        });
}

function handleLogout() {
    auth.signOut();
}

async function handleOrderSubmission(e) {
    e.preventDefault();
    const user = auth.currentUser;
    const file = e.target['proof-of-payment'].files[0];
    const statusMsg = document.getElementById('order-status-message');
    
    if (!user || !file) {
        showMessage(statusMsg, "You must be logged in and select a proof of payment to continue.", 'error');
        return;
    }
    
    showMessage(statusMsg, 'Processing your order...', 'success');
    
    try {
        const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        
        // Create order document
        const newOrderRef = await db.collection('orders').add({
            userId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Pending Confirmation',
            totalAmount: total,
            items: cart,
            shippingInfo: {
                name: e.target['shipping-name'].value,
                address: e.target['shipping-address'].value,
                city: e.target['shipping-city'].value,
                postalCode: e.target['shipping-postal-code'].value,
            }
        });
        
        // Upload proof of payment
        const filePath = `payment_proofs/${user.uid}/${newOrderRef.id}-${file.name}`;
        const uploadTask = await storage.ref(filePath).put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        // Update order with payment proof URL
        await newOrderRef.update({ paymentProofUrl: downloadURL });
        
        // Clear cart and show success message
        localStorage.removeItem('mysticManesCart');
        showMessage(statusMsg, '✨ Your magical order has been placed successfully!', 'success');
        e.target.reset();
        
    } catch (error) {
        console.error('Order submission error:', error);
        showMessage(statusMsg, `Error: ${error.message}`, 'error');
    }
}

// ============================= UTILITIES ==============================
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `status-message status-${type}`;
    element.classList.remove('hidden');
    
    if (type === 'success') {
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================ INITIALIZATION ==============================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize color swatches
    createColorSwatches(
        document.getElementById('noseband-colors'), 
        productData.nosebandColors, 
        'noseband'
    );
    createColorSwatches(
        document.getElementById('cheekpieces-colors'), 
        productData.cheekpieceColors, 
        'cheekpieces'
    );

    // Set product price
    document.getElementById('product-price').textContent = `R${productData.price.toFixed(2)}`;
    
    // Event listeners
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('order-form').addEventListener('submit', handleOrderSubmission);
    
    // Show home page by default
    showPage('home');
});

// Make functions available globally for onclick handlers
window.showPage = showPage;
window.removeItemFromCart = removeItemFromCart;