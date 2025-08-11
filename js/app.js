// ================================== NAVIGATION ==================================
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    
    // Show selected page with a fade-in animation
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
        selectedPage.classList.add('fade-in');
        setTimeout(() => selectedPage.classList.remove('fade-in'), 500);
    }
    
    // Run page-specific logic when a page is shown
    if (pageId === 'cart') renderCart();
    if (pageId === 'checkout') updateCheckoutTotal();
}

// =============================== FIREBASE SETUP ===============================
// IMPORTANT: Replace these with your actual Firebase project keys!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// =============================== DATA & STATE ===============================
const productData = {
    price: 250.00,
    colors: ['pink', 'cyan', 'green', 'purple', 'yellow'],
};
const colorHexMap = { pink: '#EC4899', cyan: '#06B6D4', green: '#10B981', purple: '#8B5CF6', yellow: '#F59E0B' };
let currentHalterDesign = { noseband: null, cheekpieces: null };

// ============================ HELPER FUNCTIONS ==============================
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message status-${type}`; // Resets classes
    element.classList.remove('hidden');
    
    if (type === 'success') {
        setTimeout(() => element.classList.add('hidden'), 4000);
    }
}

function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ============================ SHOP PAGE LOGIC ===============================
function createColorSwatches(containerId, part) {
    const container = document.getElementById(containerId);
    productData.colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = colorHexMap[color];
        swatch.onclick = () => selectColor(container, swatch, part, color);
        container.appendChild(swatch);
    });
}

function selectColor(container, selectedSwatch, part, color) {
    container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    selectedSwatch.classList.add('selected');
    currentHalterDesign[part] = color;
    
    // This updates the preview images
    const imageElement = document.getElementById(`${part}-image`);
    if (imageElement) {
        imageElement.src = `images/${part}-${color}.png`;
    }
}

function addToCart() {
    if (!currentHalterDesign.noseband || !currentHalterDesign.cheekpieces) {
        showMessage('cart-feedback-message', 'Please select colors for both parts!', 'error');
        return;
    }
    let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    cart.push({
        id: 'customHalter_' + Date.now(),
        name: 'Custom Rope Halter',
        price: productData.price,
        design: { ...currentHalterDesign },
    });
    localStorage.setItem('mysticManesCart', JSON.stringify(cart));
    showMessage('cart-feedback-message', '✨ Added to your cart!', 'success');
}

// ============================= CART PAGE LOGIC ==============================
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (cart.length === 0) {
        document.getElementById('empty-cart-message').classList.remove('hidden');
        document.getElementById('cart-summary').classList.add('hidden');
    } else {
        document.getElementById('empty-cart-message').classList.add('hidden');
        document.getElementById('cart-summary').classList.remove('hidden');
        
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price;
            container.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>Noseband: ${capitalizeFirst(item.design.noseband)}</p>
                        <p>Cheek Pieces: ${capitalizeFirst(item.design.cheekpieces)}</p>
                    </div>
                    <div class="cart-item-price">R${item.price.toFixed(2)}</div>
                    <button class="remove-btn" onclick="removeItemFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
                </div>`;
        });
        document.getElementById('cart-total').textContent = `R${subtotal.toFixed(2)}`;
    }
}

function removeItemFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('mysticManesCart', JSON.stringify(cart));
    renderCart(); // Refresh the cart view
}

// =========================== CHECKOUT PAGE LOGIC ============================
auth.onAuthStateChanged(user => {
    const authSection = document.getElementById('auth-section');
    const checkoutSection = document.getElementById('checkout-section');
    if (user) {
        authSection.classList.add('hidden');
        checkoutSection.classList.remove('hidden');
        document.getElementById('user-email-display').textContent = user.email;
    } else {
        authSection.classList.remove('hidden');
        checkoutSection.classList.add('hidden');
    }
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
});

function updateCheckoutTotal() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('total-payment-amount').textContent = `R${total.toFixed(2)}`;
}

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target['login-email'].value;
    const password = e.target['login-password'].value;
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => showMessage('auth-error-message', error.message, 'error'));
});

document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target['signup-email'].value;
    const password = e.target['signup-password'].value;
    auth.createUserWithEmailAndPassword(email, password)
        .catch(error => showMessage('auth-error-message', error.message, 'error'));
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const file = e.target['proof-of-payment'].files[0];
    if (!user || !file) {
        showMessage('order-status-message', "You must be logged in and select a proof of payment.", 'error');
        return;
    }
    showMessage('order-status-message', 'Processing your order...', 'success');
    try {
        const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const newOrderRef = await db.collection('orders').add({
            userId: user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp(), status: 'Pending', totalAmount: total, items: cart
        });
        const filePath = `payment_proofs/${user.uid}/${newOrderRef.id}-${file.name}`;
        const uploadTask = await storage.ref(filePath).put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        await newOrderRef.update({ paymentProofUrl: downloadURL });
        localStorage.removeItem('mysticManesCart');
        showMessage('order-status-message', '✨ Your magical order has been placed!', 'success');
        e.target.reset();
        setTimeout(() => showPage('home'), 4000);
    } catch (error) {
        showMessage('order-status-message', `Error: ${error.message}`, 'error');
    }
});

// ============================ INITIALIZATION ==============================
document.addEventListener('DOMContentLoaded', () => {
    // Make sure functions called by inline onclicks are globally available
    window.showPage = showPage;
    window.removeItemFromCart = removeItemFromCart;
    window.handleForgotPassword = handleForgotPassword;

    // Initialize the Shop Page
    createColorSwatches('noseband-colors', 'noseband');
    createColorSwatches('cheekpieces-colors', 'cheekpieces');
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
    document.getElementById('product-price').textContent = `R${productData.price.toFixed(2)}`;
    
    // Show the home page by default
    showPage('home');
});