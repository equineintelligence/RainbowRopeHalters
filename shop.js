// --- Mystic Manes Halters: shop.js ---

// This function runs when the page is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // In the future, you will get this data from your Firebase database.
    // For now, we'll define it here.
    const productData = {
        price: 250.00,
        nosebandColors: ['pink', 'cyan', 'green', 'purple', 'yellow'],
        cheekpieceColors: ['pink', 'cyan', 'green', 'purple', 'yellow'],
    };

    // --- State Management ---
    // This object will keep track of the customer's current design.
    let currentHalterDesign = {
        noseband: 'default',
        cheekpieces: 'default',
    };

    // --- Element References ---
    // Getting references to the HTML elements we need to interact with.
    const nosebandImage = document.getElementById('noseband-image');
    const cheekpiecesImage = document.getElementById('cheekpieces-image');
    const priceDisplay = document.getElementById('product-price');
    const nosebandColorContainer = document.getElementById('noseband-colors');
    const cheekpieceColorContainer = document.getElementById('cheekpieces-colors');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const cartFeedback = document.getElementById('cart-feedback-message');

    // --- Functions ---

    /**
     * Updates the image source for a part of the halter.
     * @param {string} part - The part to change ('noseband' or 'cheekpieces').
     * @param {string} color - The selected color.
     */
    window.changeImage = function(part, color) {
        const imageElement = document.getElementById(`${part}-image`);
        if (imageElement) {
            imageElement.src = `images/${part}-${color}.png`;
            // Update the current design state
            currentHalterDesign[part] = color;
            console.log('Current Design:', currentHalterDesign);
        }
    };

    /**
     * Creates the color swatch divs and adds them to the page.
     * @param {HTMLElement} container - The container to add swatches to.
     * @param {string[]} colors - An array of color names.
     * @param {string} part - The part these colors apply to.
     */
    function createColorSwatches(container, colors, part) {
        container.innerHTML = ''; // Clear existing swatches
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'swatch';
            // This is a simple way to map color names to hex codes for display
            const colorHexMap = {
                pink: '#ff79c6', cyan: '#8be9fd', green: '#50fa7b', purple: '#bd93f9', yellow: '#f1fa8c'
            };
            swatch.style.backgroundColor = colorHexMap[color] || color;
            swatch.onclick = () => {
                window.changeImage(part, color);
                // Optional: Add a 'selected' class for styling
                const allSwatches = container.querySelectorAll('.swatch');
                allSwatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            };
            container.appendChild(swatch);
        });
    }

    /**
     * Handles adding the current halter design to the cart (localStorage).
     */
    function addToCart() {
        // Check if the user has selected colors for both parts
        if (currentHalterDesign.noseband === 'default' || currentHalterDesign.cheekpieces === 'default') {
            cartFeedback.textContent = 'Please select a color for both parts!';
            cartFeedback.style.color = 'red';
            return;
        }

        // Get the existing cart from localStorage, or create an empty array
        let cart = JSON.parse(localStorage.getItem('mysticManesCart')) || [];

        // Create a new item object
        const newItem = {
            id: 'customHalter_' + Date.now(), // Unique ID for this item
            name: 'Custom Rope Halter',
            price: productData.price,
            design: currentHalterDesign,
        };

        // Add the new item to the cart array
        cart.push(newItem);

        // Save the updated cart back to localStorage
        localStorage.setItem('mysticManesCart', JSON.stringify(cart));

        // Give feedback to the user
        cartFeedback.textContent = '🦄✨ Added to your Treasure Chest!';
        cartFeedback.style.color = 'var(--accent-purple)';
        
        // Clear the message after a few seconds
        setTimeout(() => {
            cartFeedback.textContent = '';
        }, 3000);
    }

    // --- Initialization ---
    // This is where we start everything when the page loads.
    
    // Set the initial price display
    priceDisplay.textContent = `R${productData.price.toFixed(2)}`;

    // Create the color swatches on the page
    createColorSwatches(nosebandColorContainer, productData.nosebandColors, 'noseband');
    createColorSwatches(cheekpieceColorContainer, productData.cheekpieceColors, 'cheekpieces');

    // Add the click event listener to the "Add to Cart" button
    addToCartBtn.addEventListener('click', addToCart);
});