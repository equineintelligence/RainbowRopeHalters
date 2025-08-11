// --- Mystic Manes Halters: checkout.js ---
// IMPORTANT: You need to add the Firebase SDK scripts to your checkout.html file for this to work!

// --- PASTE YOUR FIREBASE CONFIGURATION HERE ---
// You get this from your Firebase project settings
const firebaseConfig = {
    apiKey: "AIzaSyAywmtgbd8u2a_P82NVVwzAepKOuEibqWQ",
    authDomain: "rope-halter-rainboww.firebaseapp.com",
    projectId: "rope-halter-rainboww",
    storageBucket: "rope-halter-rainboww.firebasestorage.app",
    messagingSenderId: "626626308371",
    appId: "1:626626308371:web:3c8bf50555f2a07be692e6",
    measurementId: "G-J9H460J98N"
  };

// --- Initialize Firebase ---
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();


document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const authSection = document.getElementById('auth-section');
    const checkoutSection = document.getElementById('checkout-section');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmailDisplay = document.getElementById('user-email-display');
    const authErrorMessage = document.getElementById('auth-error-message');
    const orderForm = document.getElementById('order-form');
    const totalPaymentAmount = document.getElementById('total-payment-amount');
    const orderStatusMessage = document.getElementById('order-status-message');

    // --- Firebase Auth State Listener ---
    // This is the most important listener. It checks if a user is logged in or not.
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            console.log('User is logged in:', user.email);
            authSection.style.display = 'none';
            checkoutSection.style.display = 'block';
            userEmailDisplay.textContent = user.email;
            updateCheckoutTotal();
        } else {
            // User is signed out.
            console.log('User is logged out.');
            authSection.style.display = 'block';
            checkoutSection.style.display = 'none';
        }
    });

    // --- Auth Form Event Handlers ---
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = signupForm['signup-email'].value;
        const password = signupForm['signup-password'].value;
        auth.createUserWithEmailAndPassword(email, password)
            .catch(error => {
                authErrorMessage.textContent = error.message;
            });
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                authErrorMessage.textContent = error.message;
            });
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    // --- Checkout Logic ---
    function updateCheckoutTotal() {
        const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        totalPaymentAmount.textContent = `R${total.toFixed(2)}`;
    }

    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        orderStatusMessage.textContent = 'Placing your order... 🦄';

        const user = auth.currentUser;
        if (!user) {
            orderStatusMessage.textContent = 'You must be logged in to place an order.';
            return;
        }

        // 1. Get form data
        const shippingName = orderForm['shipping-name'].value;
        const shippingAddress = orderForm['shipping-address'].value;
        const shippingCity = orderForm['shipping-city'].value;
        const postalCode = orderForm['shipping-postal-code'].value;
        const paymentFile = orderForm['proof-of-payment'].files[0];

        if (!paymentFile) {
            orderStatusMessage.textContent = 'Please upload your proof of payment.';
            return;
        }

        try {
            // 2. Create a new order document in Firestore
            const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
            const total = cart.reduce((sum, item) => sum + item.price, 0);

            const newOrderRef = await db.collection('orders').add({
                userId: user.uid,
                userEmail: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'Pending Confirmation',
                totalAmount: total,
                shippingDetails: {
                    name: shippingName,
                    address: shippingAddress,
                    city: shippingCity,
                    postalCode: postalCode
                },
                items: cart,
                paymentProofUrl: '' // We'll update this after upload
            });

            console.log('Order created with ID:', newOrderRef.id);

            // 3. Upload the proof of payment to Firebase Storage
            const filePath = `payment_proofs/${user.uid}/${newOrderRef.id}-${paymentFile.name}`;
            const fileRef = storage.ref(filePath);
            const uploadTask = await fileRef.put(paymentFile);
            const downloadURL = await uploadTask.ref.getDownloadURL();

            console.log('File uploaded to:', downloadURL);

            // 4. Update the order document with the file URL
            await newOrderRef.update({
                paymentProofUrl: downloadURL
            });

            // 5. Clear the cart and give success message
            localStorage.removeItem('mysticManesCart');
            orderStatusMessage.textContent = '✨ Your magical order has been placed successfully! We will contact you shortly.';
            orderStatusMessage.style.color = 'var(--accent-green)';
            orderForm.reset();

        } catch (error) {
            console.error('Error placing order:', error);
            orderStatusMessage.textContent = `An error occurred: ${error.message}`;
            orderStatusMessage.style.color = 'red';
        }
    });
});