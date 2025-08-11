// ================================== NAVIGATION ==================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
        selectedPage.classList.add('fade-in');
        setTimeout(() => selectedPage.classList.remove('fade-in'), 500);
    }
    if (pageId === 'cart') renderCart();
    if (pageId === 'checkout') updateCheckoutTotal();
}

// =============================== FIREBASE SETUP ===============================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// const storage = firebase.storage(); // No longer needed for POP upload

// =============================== DATA & STATE ===============================
const productData = { price: 250.00, colors: ['pink', 'cyan', 'green', 'purple', 'yellow'] };
const colorHexMap = { pink: '#EC4899', cyan: '#06B6D4', green: '#10B981', purple: '#8B5CF6', yellow: '#F59E0B' };
let currentHalterDesign = { noseband: null, cheekpieces: null };

// ============================ HELPER FUNCTIONS ==============================
function showMessage(elementId, message, type) { /* ... remains the same */ }
function capitalizeFirst(str) { /* ... remains the same */ }

// CHANGE 2: New function to update the cart counter in the nav
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const counter = document.getElementById('cart-counter');
    counter.textContent = cart.length;
    // Animate the counter when an item is added
    counter.style.transform = 'scale(1.2)';
    setTimeout(() => { counter.style.transform = 'scale(1)'; }, 200);
}

// ============================ SHOP PAGE LOGIC ===============================
function createColorSwatches(containerId, part) { /* ... remains the same */ }
function selectColor(container, selectedSwatch, part, color) { /* ... remains the same */ }

function addToCart() {
    if (!currentHalterDesign.noseband || !currentHalterDesign.cheekpieces) {
        showMessage('cart-feedback-message', 'Please select colors for both parts!', 'error');
        return;
    }
    let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    cart.push({
        id: 'customHalter_' + Date.now(), name: 'Custom Rope Halter', price: productData.price, design: { ...currentHalterDesign },
    });
    localStorage.setItem('mysticManesCart', JSON.stringify(cart));
    showMessage('cart-feedback-message', '✨ Added to your cart!', 'success');
    updateCartCounter(); // Update the counter when an item is added
}

// ============================= CART PAGE LOGIC ==============================
function renderCart() { /* ... remains the same */ }

function removeItemFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('mysticManesCart', JSON.stringify(cart));
    renderCart();
    updateCartCounter(); // Update the counter when an item is removed
}

// =========================== CHECKOUT PAGE LOGIC ============================
auth.onAuthStateChanged(user => { /* ... remains the same */ });
function updateCheckoutTotal() { /* ... remains the same */ }
document.getElementById('login-form').addEventListener('submit', (e) => { /* ... remains the same */ });
document.getElementById('signup-form').addEventListener('submit', (e) => { /* ... remains the same */ });
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
// CHANGE 3 & 4: Rewritten order submission logic
document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showMessage('order-status-message', "You must be logged in to place an order.", 'error');
        return;
    }
    showMessage('order-status-message', 'Placing your order...', 'success');

    try {
        const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.price, 0);

        // Save order to Firestore (without POP URL)
        await db.collection('orders').add({
            userId: user.uid,
            userEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Pending POP', // New status
            totalAmount: total,
            items: cart,
            shippingInfo: {
                name: document.getElementById('shipping-name').value,
                address: document.getElementById('shipping-address').value,
            }
        });

        // Clear the cart and update counter
        localStorage.removeItem('mysticManesCart');
        updateCartCounter();
        e.target.reset();

        // Show the new "Thank You" page
        showPage('thank-you');

    } catch (error) {
        showMessage('order-status-message', `Error: ${error.message}`, 'error');
    }
});

// Add this function to your app.js file
function handleForgotPassword() {
    const email = prompt("Please enter your email address to reset your password:");
    
    if (email) {
        auth.sendPasswordResetEmail(email)
            .then(() => {
                alert("Password reset email sent! Please check your inbox.");
            })
            .catch((error) => {
                alert(`Error: ${error.message}`);
            });
    }
}

// ============================ INITIALIZATION ==============================
document.addEventListener('DOMContentLoaded', () => {
    // Make functions globally available for inline onclicks
    window.showPage = showPage;
    window.removeItemFromCart = removeItemFromCart;
    window.handleForgotPassword = handleForgotPassword; // 
    
    // Initialize the Shop Page
    createColorSwatches('noseband-colors', 'noseband');
    createColorSwatches('cheekpieces-colors', 'cheekpieces');
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
    document.getElementById('product-price').textContent = `R${productData.price.toFixed(2)}`;
    
    // Set initial cart count on page load
    updateCartCounter(); 
    
    // Show the home page by default
    showPage('home');
});