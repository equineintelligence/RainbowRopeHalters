// ================================== NAVIGATION ==================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    if (pageId === 'cart') renderCart();
    if (pageId === 'checkout') updateCheckoutTotal();
}

// =============================== FIREBASE SETUP ===============================
// PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
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

// ============================ SHOP PAGE LOGIC ===============================
const productData = {
    price: 250.00,
    nosebandColors: ['pink', 'cyan', 'green', 'purple', 'yellow'],
    cheekpieceColors: ['pink', 'cyan', 'green', 'purple', 'yellow'],
};
let currentHalterDesign = { noseband: 'default', cheekpieces: 'default' };

window.changeImage = function(part, color) {
    document.getElementById(`${part}-image`).src = `images/${part}-${color}.png`;
    currentHalterDesign[part] = color;
};

function createColorSwatches(container, colors, part) {
    container.innerHTML = '';
    const colorHexMap = { pink: '#ff79c6', cyan: '#8be9fd', green: '#50fa7b', purple: '#bd93f9', yellow: '#f1fa8c' };
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'swatch';
        swatch.style.backgroundColor = colorHexMap[color] || color;
        swatch.onclick = () => {
            window.changeImage(part, color);
            container.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        };
        container.appendChild(swatch);
    });
}

document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    const feedback = document.getElementById('cart-feedback-message');
    if (currentHalterDesign.noseband === 'default' || currentHalterDesign.cheekpieces === 'default') {
        feedback.textContent = 'Please select a color for both parts!';
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
    feedback.textContent = '🦄✨ Added to your Treasure Chest!';
    setTimeout(() => { feedback.textContent = ''; }, 3000);
});

// ============================= CART PAGE LOGIC ==============================
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (cart.length === 0) {
        document.getElementById('empty-cart-message').style.display = 'block';
        document.getElementById('cart-summary').style.display = 'none';
    } else {
        document.getElementById('empty-cart-message').style.display = 'none';
        document.getElementById('cart-summary').style.display = 'block';
        let subtotal = 0;
        cart.forEach(item => {
            subtotal += item.price;
            container.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>Noseband: ${item.design.noseband}</p>
                        <p>Cheek Pieces: ${item.design.cheekpieces}</p>
                    </div>
                    <div class="cart-item-price">R${item.price.toFixed(2)}</div>
                    <button class="remove-item-btn" onclick="removeItemFromCart('${item.id}')">Remove</button>
                </div>`;
        });
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
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('checkout-section').style.display = 'block';
        document.getElementById('user-email-display').textContent = user.email;
    } else {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('checkout-section').style.display = 'none';
    }
});

document.getElementById('signup-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target['signup-email'].value;
    const password = e.target['signup-password'].value;
    auth.createUserWithEmailAndPassword(email, password).catch(err => alert(err.message));
});

document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target['login-email'].value;
    const password = e.target['login-password'].value;
    auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

document.getElementById('order-form').addEventListener('submit', async e => {
    e.preventDefault();
    const user = auth.currentUser;
    const file = e.target['proof-of-payment'].files[0];
    const statusMsg = document.getElementById('order-status-message');
    if (!user || !file) {
        alert("You must be logged in and select a proof of payment to continue.");
        return;
    }
    statusMsg.textContent = 'Placing your order...';
    try {
        const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const newOrderRef = await db.collection('orders').add({
            userId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'Pending Confirmation',
            totalAmount: total,
            items: cart
        });
        const filePath = `payment_proofs/${user.uid}/${newOrderRef.id}-${file.name}`;
        const uploadTask = await storage.ref(filePath).put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        await newOrderRef.update({ paymentProofUrl: downloadURL });
        localStorage.removeItem('mysticManesCart');
        statusMsg.textContent = '✨ Your magical order has been placed successfully!';
        e.target.reset();
    } catch (error) {
        statusMsg.textContent = `Error: ${error.message}`;
    }
});

function updateCheckoutTotal() {
    const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('total-payment-amount').textContent = `R${total.toFixed(2)}`;
}

// ============================ INITIALIZATION ==============================
document.addEventListener('DOMContentLoaded', () => {
    // Populate Shop Swatches
    createColorSwatches(document.getElementById('noseband-colors'), productData.nosebandColors, 'noseband');
    createColorSwatches(document.getElementById('cheekpieces-colors'), productData.cheekpieceColors, 'cheekpieces');
    document.getElementById('product-price').textContent = `R${productData.price.toFixed(2)}`;
    
    // Show the home page by default
    showPage('home');
});