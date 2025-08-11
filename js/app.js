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
  apiKey: "AIzaSyAywmtgbd8u2a_P82NVVwzAepKOuEibqWQ",
  authDomain: "rope-halter-rainboww.firebaseapp.com",
  projectId: "rope-halter-rainboww",
  messagingSenderId: "626626308371",
  appId: "1:626626308371:web:3c8bf50555f2a07be692e6",
  measurementId: "G-J9H460J98N"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// =============================== DATA & STATE ===============================
const productData = { price: 250.00, colors: ['pink', 'cyan', 'green', 'purple', 'yellow'] };
const colorHexMap = { pink: '#EC4899', cyan: '#06B6D4', green: '#10B981', purple: '#8B5CF6', yellow: '#F59E0B' };
let currentHalterDesign = { size: null, noseband: null, cheekpieces: null };

// ============================ HELPER FUNCTIONS ==============================
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message status-${type}`;
    element.classList.remove('hidden');
    if (type === 'success') {
        setTimeout(() => element.classList.add('hidden'), 4000);
    }
}
function capitalizeFirst(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const counter = document.getElementById('cart-counter');
    counter.textContent = cart.length;
    counter.style.transform = 'scale(1.2)';
    setTimeout(() => { counter.style.transform = 'scale(1)'; }, 200);
}

// ============================ SHOP PAGE LOGIC ===============================
function createColorSwatches(containerId, part) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
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
    const imageElement = document.getElementById(`${part}-image`);
    if (imageElement) { imageElement.src = `images/${part}-${color}.png`; }
}

function addToCart() {
    const selectedSize = document.getElementById('halter-size').value;
    if (!selectedSize) {
        showMessage('cart-feedback-message', 'Please select a halter size!', 'error');
        return;
    }
    if (!currentHalterDesign.noseband || !currentHalterDesign.cheekpieces) {
        showMessage('cart-feedback-message', 'Please select colors for both parts!', 'error');
        return;
    }
    currentHalterDesign.size = selectedSize;
    let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    cart.push({
        id: 'customHalter_' + Date.now(),
        name: 'Custom Rope Halter',
        price: productData.price,
        design: { ...currentHalterDesign },
    });
    localStorage.setItem('mysticManesCart', JSON.stringify(cart));
    showMessage('cart-feedback-message', '✨ Added to your cart!', 'success');
    updateCartCounter();
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
                        <p><strong>Size:</strong> ${item.design.size}</p>
                        <p><strong>Noseband:</strong> ${capitalizeFirst(item.design.noseband)}</p>
                        <p><strong>Cheek Pieces:</strong> ${capitalizeFirst(item.design.cheekpieces)}</p>
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
    renderCart();
    updateCartCounter();
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

function handleForgotPassword() {
    const email = prompt("Please enter your email to reset your password:");
    if (email) {
        auth.sendPasswordResetEmail(email)
            .then(() => alert("Password reset email sent! Please check your inbox."))
            .catch((error) => alert(`Error: ${error.message}`));
    }
}

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
        await db.collection('orders').add({
            userId: user.uid,
            userEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Pending POP',
            totalAmount: total,
            items: cart,
            shippingInfo: {
                name: document.getElementById('shipping-name').value,
                address: document.getElementById('shipping-address').value,
            }
        });
        localStorage.removeItem('mysticManesCart');
        updateCartCounter();
        e.target.reset();
        showPage('thank-you');
    } catch (error) {
        showMessage('order-status-message', `Error: ${error.message}`, 'error');
    }
});

// ============================ INITIALIZATION ==============================
document.addEventListener('DOMContentLoaded', () => {
    window.showPage = showPage;
    window.removeItemFromCart = removeItemFromCart;
    window.handleForgotPassword = handleForgotPassword;
    createColorSwatches('noseband-colors', 'noseband');
    createColorSwatches('cheekpieces-colors', 'cheekpieces');
    document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
    document.getElementById('product-price').textContent = `R${productData.price.toFixed(2)}`;
    updateCartCounter();
    showPage('home');
});