// --- Mystic Manes Halters: cart.js ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');

    // --- Functions ---

    /**
     * Renders all items from localStorage into the cart page.
     */
    function renderCart() {
        // Get cart from localStorage
        const cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];

        // Clear the current display
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            // Show the "empty cart" message and hide the summary
            emptyCartMessage.style.display = 'block';
            cartSummary.style.display = 'none';
        } else {
            // Hide the "empty cart" message and show the summary
            emptyCartMessage.style.display = 'none';
            cartSummary.style.display = 'block';

            let subtotal = 0;

            // Loop through each item in the cart and create the HTML for it
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'cart-item';
                cartItemDiv.innerHTML = `
                    <img src="images/cart-item-placeholder.png" alt="Custom Halter" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>Noseband: <span style="text-transform: capitalize;">${item.design.noseband}</span></p>
                        <p>Cheek Pieces: <span style="text-transform: capitalize;">${item.design.cheekpieces}</span></p>
                    </div>
                    <div class="cart-item-price">R${item.price.toFixed(2)}</div>
                    <button class="remove-item-btn" data-item-id="${item.id}">Remove</button>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
                subtotal += item.price;
            });

            // Update the summary totals
            cartSubtotal.textContent = `R${subtotal.toFixed(2)}`;
            cartTotal.textContent = `R${subtotal.toFixed(2)}`; // Assuming no shipping/tax yet
        }
    }

    /**
     * Removes an item from the cart and re-renders the display.
     * @param {string} itemId - The ID of the item to remove.
     */
    function removeItemFromCart(itemId) {
        let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];
        
        // Filter out the item that matches the itemId
        const updatedCart = cart.filter(item => item.id !== itemId);

        // Save the updated cart back to localStorage
        localStorage.setItem('mysticManesCart', JSON.stringify(updatedCart));

        // Re-render the cart display
        renderCart();
    }

    // --- Event Listeners ---

    // Use event delegation to handle clicks on remove buttons
    cartItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const itemId = event.target.getAttribute('data-item-id');
            removeItemFromCart(itemId);
        }
    });

    // --- Initialization ---
    renderCart();
});