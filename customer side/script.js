/**
 * Poke Cafe - Digital Menu Application Logic
 *
 * Data layer is handled entirely by the backend module (api.js).
 * This file is responsible for UI rendering, state management and event handling.
 */

import {
    getMenu,
    getItemById,
    filterByCategory,
    searchItems,
    placeOrder,
    updateOrderStatus,
    getOrders,
    getTopPopularDishes
} from "../backend/core/api.js";

/* =========================================================
   2. APPLICATION STATE
   ========================================================= */
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let previousOrderStatuses = {};

/* =========================================================
   3. DOM ELEMENTS
   ========================================================= */
const menuGrid = document.getElementById("menuGrid");
const topPicksGrid = document.getElementById("topPicksGrid");
const categoryBtns = document.querySelectorAll(".category-btn");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");
const floatingCart = document.getElementById("floatingCart");

/* =========================================================
   4. INITIALIZATION
   ========================================================= */
function init() {
    checkTableId();
    setupFeaturedDishes();
    renderMenu();
    setupEventListeners();
    renderOrderTracking();

    setInterval(renderOrderTracking, 3000);

    // Auto-refresh when localStorage changes in another tab (like admin)
    window.addEventListener('storage', (e) => {
        if (e.key === 'pokecafe_menu' || e.key === 'restaurant_orders') {
            setupFeaturedDishes();
            renderMenu();
            renderOrderTracking();
        }
    });
}

function checkTableId() {
    const saved = localStorage.getItem('customer_table_id');
    if (saved) {
        document.getElementById("tableNumber").value = saved;
        const group = document.getElementById("tableNumberGroup");
        if(group) group.style.display = "none";
    }
}

function setupFeaturedDishes() {
    const topIds = getTopPopularDishes(10);
    const availableTop = [];
    
    for (const id of topIds) {
        const dish = getItemById(id);
        if (dish && dish.available) {
            availableTop.push(dish);
            if (availableTop.length === 2) break;
        }
    }

    if (availableTop.length < 2) {
        const allDishes = getMenu().filter(d => d.available && d.popular);
        for (const dish of allDishes) {
            if (!availableTop.find(d => d.id === dish.id)) {
                availableTop.push(dish);
            }
            if (availableTop.length === 2) break;
        }
    }
    
    if (availableTop[0]) {
        document.getElementById('heroCard1').style.display = 'block';
        document.getElementById('heroImg1').src = availableTop[0].image || 'assets/placeholder.jpg';
        document.getElementById('heroName1').innerText = availableTop[0].name;
        document.getElementById('heroCard1').onclick = () => openDishModal(availableTop[0]);
    }
    if (availableTop[1]) {
        document.getElementById('heroCard2').style.display = 'block';
        document.getElementById('heroImg2').src = availableTop[1].image || 'assets/placeholder.jpg';
        document.getElementById('heroName2').innerText = availableTop[1].name;
        document.getElementById('heroCard2').onclick = () => openDishModal(availableTop[1]);
    }
}

/* =========================================================
   5. MENU RENDERING LOGIC
   ========================================================= */
function renderMenu() {
    menuGrid.innerHTML = "";
    topPicksGrid.innerHTML = "";

    let visibleItems;

    if (searchQuery.trim() !== "") {
        visibleItems = searchItems(searchQuery);
    } else if (currentCategory === "all") {
        visibleItems = getMenu();
    } else {
        visibleItems = filterByCategory(currentCategory);
    }

    const topPicksSection = document.querySelector(".top-picks-section");
    const showTopPicks = currentCategory === "all" && searchQuery === "";

    if (showTopPicks) {
        const topPicks = getMenu().filter(item => item.popular);
        topPicks.forEach(dish => topPicksGrid.appendChild(createDishCard(dish)));
        topPicksSection.style.display = topPicks.length > 0 ? "block" : "none";
    } else {
        topPicksSection.style.display = "none";
    }

    visibleItems.forEach(dish => menuGrid.appendChild(createDishCard(dish)));
}

function createDishCard(dish) {
    const div = document.createElement("div");
    div.className = "dish-card";

    div.onclick = (e) => {
        if (!e.target.classList.contains("add-btn")) {
            openDishModal(dish);
        }
    };

    const statusHtml = dish.available
        ? `<div class="availability">Available</div>`
        : `<div class="availability unavailable">Currently Unavailable</div>`;

    const badgeHtml = dish.popular ? `<div class="badge">Chef's Pick</div>` : "";
    const disabledAttr = !dish.available
        ? 'disabled style="border-color:#ccc; color:#ccc; cursor:not-allowed;"'
        : "";

    div.innerHTML = `
        ${badgeHtml}
        <img src="${dish.image || 'assets/placeholder.jpg'}" class="card-img" style="object-fit: cover; background-color: #F8F6F0;" alt="${dish.name}">
        <div class="dish-info">
            <div class="dish-header">
                <span class="dish-name">${dish.name}</span>
            </div>
            <p class="dish-desc">${dish.desc}</p>
            ${statusHtml}
            <div class="dish-footer">
                <span class="dish-price">₹${dish.price}</span>
                <button class="add-btn" onclick="quickAddToCart(${dish.id}, event)" ${disabledAttr}>+</button>
            </div>
        </div>
    `;
    return div;
}

/* =========================================================
   6. EVENT LISTENERS
   ========================================================= */
function setupEventListeners() {
    categoryBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            categoryBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentCategory = e.target.dataset.category;
            renderMenu();
        });
    });

    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderMenu();
    });

    floatingCart.addEventListener("click", openCartModal);
    document.getElementById("btnProceedToBill").addEventListener("click", generateBill);
    document.getElementById("btnConfirmOrder").addEventListener("click", confirmOrder);
    document.getElementById("btnPayCounter").addEventListener("click", confirmOrder);

    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            closeAllModals();
        }
    });
}

/* =========================================================
   7. MODAL MANAGEMENT
   ========================================================= */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

function closeAllModals() {
    document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
}

let currentModalDish = null;
let currentModalQty = 1;

function openDishModal(dish) {
    currentModalDish = dish;
    currentModalQty = 1;

    document.getElementById("modalImg").src = dish.image || 'assets/placeholder.jpg';
    document.getElementById("modalDishName").innerText = dish.name;
    document.getElementById("modalDishDesc").innerText = dish.desc;

    const ingredientsList = document.getElementById("modalIngredients");
    ingredientsList.innerHTML = "";
    dish.ingredients.forEach(ing => {
        const li = document.createElement("li");
        li.innerText = ing;
        ingredientsList.appendChild(li);
    });

    updateModalPrice();

    document.getElementById("modalQtyMinus").onclick = () => {
        if (currentModalQty > 1) {
            currentModalQty--;
            updateModalPrice();
        }
    };

    document.getElementById("modalQtyPlus").onclick = () => {
        currentModalQty++;
        updateModalPrice();
    };

    const addBtn = document.getElementById("modalAddToCart");

    if (!dish.available) {
        addBtn.innerText = "Currently Unavailable";
        addBtn.style.backgroundColor = "#A0968A";
        addBtn.disabled = true;
    } else {
        addBtn.style.backgroundColor = "";
        addBtn.disabled = false;
        addBtn.onclick = () => {
            addToCart(dish, currentModalQty);
            closeModal("dishModal");
        };
    }

    document.getElementById("dishModal").classList.add("active");
}

function updateModalPrice() {
    document.getElementById("modalQty").innerText = currentModalQty;
    const total = currentModalDish.price * currentModalQty;
    document.getElementById("modalAddToCart").innerHTML = `Add to Cart - <span>₹${total}</span>`;
}

/* =========================================================
   8. CART MANAGEMENT
   ========================================================= */
function quickAddToCart(dishId, event) {
    event.stopPropagation();
    const dish = getItemById(dishId);
    if (dish && dish.available) {
        addToCart(dish, 1);
    }
}

function addToCart(dish, qty) {
    const existing = cart.find(item => item.id === dish.id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...dish, qty });
    }
    updateCartIconUI();
}

function removeFromCart(dishId) {
    cart = cart.filter(item => item.id !== dishId);
    updateCartIconUI();
    renderCartList();
}

function updateCartItemQty(dishId, delta) {
    const item = cart.find(i => i.id === dishId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            removeFromCart(dishId);
        } else {
            updateCartIconUI();
            renderCartList();
        }
    }
}

function updateCartIconUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.innerText = totalItems;
    floatingCart.style.transform = "scale(1.15) translateY(-5px)";
    setTimeout(() => { floatingCart.style.transform = ""; }, 250);
}

function openCartModal() {
    renderCartList();
    document.getElementById("cartModal").classList.add("active");
}

function renderCartList() {
    const cartItemsList = document.getElementById("cartItemsList");
    cartItemsList.innerHTML = "";

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <div style="text-align:center; padding: 3rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
                <p style="color: #A0968A; font-weight: 500;">Your cart is empty.</p>
            </div>`;
        document.getElementById("cartTotalPrice").innerText = "₹0";
        document.getElementById("btnProceedToBill").disabled = true;
        document.getElementById("btnProceedToBill").style.opacity = "0.5";
        return;
    }

    document.getElementById("btnProceedToBill").disabled = false;
    document.getElementById("btnProceedToBill").style.opacity = "1";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <img src="${item.image || 'assets/placeholder.jpg'}" class="cart-item-img" style="object-fit: cover; background-color: #F8F6F0;" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price}</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
            <div class="quantity-selector">
                <button class="qty-btn" style="width:28px; height:28px; font-size:1rem;" onclick="updateCartItemQty(${item.id}, -1)">-</button>
                <span style="font-weight: 600; min-width: 15px; text-align:center;">${item.qty}</span>
                <button class="qty-btn" style="width:28px; height:28px; font-size:1rem;" onclick="updateCartItemQty(${item.id}, 1)">+</button>
            </div>
        `;
        cartItemsList.appendChild(div);
    });

    document.getElementById("cartTotalPrice").innerText = `₹${total}`;
}

/* =========================================================
   9. BILLING AND CHECKOUT
   ========================================================= */
function generateBill() {
    const tableNum = document.getElementById("tableNumber").value;

    if (!tableNum || tableNum <= 0) {
        alert("Please enter a valid table number.");
        document.getElementById("tableNumber").focus();
        return;
    }

    closeModal("cartModal");

    document.getElementById("billTableNumber").innerText = tableNum;

    const now = new Date();
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
    document.getElementById("billDate").innerText = now.toLocaleDateString("en-US", options);

    const billItemsList = document.getElementById("billItemsList");
    billItemsList.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const div = document.createElement("div");
        div.className = "bill-item-row";
        div.innerHTML = `
            <span><span style="color:#A0968A;">${item.qty}x</span> ${item.name}</span>
            <span style="font-weight: 600;">₹${itemTotal}</span>
        `;
        billItemsList.appendChild(div);
    });

    const tax = total * 0.05;
    const finalTotal = total + tax;

    billItemsList.innerHTML += `
        <div class="bill-item-row" style="color:#7A6F69; margin-top: 1.5rem; border-top: 1px solid #F0ECE1; padding-top: 1rem;">
            <span>GST (5%)</span>
            <span>₹${tax.toFixed(2)}</span>
        </div>
    `;

    document.getElementById("billTotalPrice").innerText = `₹${finalTotal.toFixed(2)}`;
    document.getElementById("billModal").classList.add("active");
}

function confirmOrder() {
    let tableNum = document.getElementById("tableNumber").value;
    if (!tableNum) tableNum = 1;
    
    // Save table number so they aren't asked again
    localStorage.setItem('customer_table_id', tableNum);
    const group = document.getElementById("tableNumberGroup");
    if(group) group.style.display = "none";

    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalTotal = total + (total * 0.05);

    placeOrder(cart, tableNum, Number(finalTotal.toFixed(2)));

    cart = [];
    updateCartIconUI();
    closeAllModals();
    renderOrderTracking();
    alert("Thank you! Your order has been placed.");
}

function renderOrderTracking() {
    const tableId = localStorage.getItem('customer_table_id');
    const trackingSection = document.getElementById('trackingSection');
    const trackingGrid = document.getElementById('trackingGrid');
    
    if (!tableId || !trackingSection || !trackingGrid) return;

    const allOrders = getOrders();
    const activeOrders = allOrders.filter(o => String(o.tableId) === String(tableId) && o.status !== 'completed' && o.status !== 'cancelled');

    if (activeOrders.length === 0) {
        trackingSection.style.display = 'none';
        return;
    }

    trackingSection.style.display = 'block';
    trackingGrid.innerHTML = '';

    const hasReady = activeOrders.some(o => o.status === 'ready');
    const mainNode = document.querySelector('main');
    const menuSection = document.getElementById('menu');

    if (hasReady) {
        mainNode.insertBefore(trackingSection, mainNode.firstChild);
    } else {
        menuSection.appendChild(trackingSection);
    }

    activeOrders.sort((a, b) => b.createdAt - a.createdAt);

    activeOrders.forEach(order => {
        // Status Alert Logic
        if (previousOrderStatuses[order.orderId] && previousOrderStatuses[order.orderId] !== 'ready' && order.status === 'ready') {
            alert(`Order #${String(order.orderId).slice(-4)} is ready for serving!`);
        }
        previousOrderStatuses[order.orderId] = order.status;

        const card = document.createElement('div');
        card.className = 'tracking-card';

        const itemsStr = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        
        let footerHtml = '';
        const elapsed = Date.now() - order.createdAt;
        const fiveMins = 300000;
        
        if (order.status === 'placed' && elapsed < fiveMins) {
            const remaining = Math.ceil((fiveMins - elapsed) / 1000);
            const rMin = Math.floor(remaining / 60);
            const rSec = remaining % 60;
            footerHtml = `
                <div style="color: #e74c3c; font-size: 0.85rem;">Cancel window: ${rMin}m ${rSec}s</div>
                <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-color: #e74c3c; color: #e74c3c;" onclick="cancelOrder(${order.orderId})">Cancel Order</button>
            `;
        } else if (order.status === 'ready') {
            footerHtml = `
                <div style="color: #2ecc71; font-weight: 600;">Ready to serve!</div>
                <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="receiveOrder(${order.orderId})">Mark as Received</button>
            `;
        } else if (order.status === 'preparing') {
            footerHtml = `<div style="color: #3498db; font-weight: 600;">Chef is preparing your food...</div>`;
        } else {
            footerHtml = `<div style="color: #7f8c8d; font-size: 0.85rem;">Preparing shortly...</div>`;
        }

        card.innerHTML = `
            <div class="tracking-header">
                <span>Order #${String(order.orderId).slice(-4)}</span>
                <span class="tracking-status-badge ${order.status}">${order.status}</span>
            </div>
            <div class="tracking-items">${itemsStr}</div>
            <div style="font-weight: 600;">Total: ₹${order.total}</div>
            <div class="tracking-footer">
                ${footerHtml}
            </div>
        `;
        trackingGrid.appendChild(card);
    });
}

/* =========================================================
   Expose cart helpers to inline HTML onclick attributes.
   ES modules don't attach to window automatically.
   ========================================================= */
window.quickAddToCart = quickAddToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQty = updateCartItemQty;
window.closeModal = closeModal;
window.cancelOrder = function(id) {
    if (confirm("Are you sure you want to cancel this order?")) {
        updateOrderStatus(id, 'cancelled');
        renderOrderTracking();
    }
};
window.receiveOrder = function(id) {
    updateOrderStatus(id, 'completed');
    renderOrderTracking();
};

/* =========================================================
   Bootstrap
   ========================================================= */
init();
