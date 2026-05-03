// ✅ CORRECT PATH (VERY IMPORTANT)
import { getData } from "../backend/core/data.js";

// 🔥 Initialize data (ONLY ONCE)
getData();

import {
    getMenu,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    searchItems,
    getAvailableItems,
    getOrders,
    updateOrderStatus,
    getIncome,
    getTopPopularDishes
} from "../backend/core/api.js";

// -- DOM Elements --
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');

// Stats
const statTotal = document.getElementById('stat-total');
const statAvailable = document.getElementById('stat-available');
const statUnavailable = document.getElementById('stat-unavailable');

// Manage Dishes
const dishesTableBody = document.getElementById('dishesTableBody');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const btnAddDish = document.getElementById('btnAddDish');

// Modal
const dishModal = document.getElementById('dishModal');
const dishForm = document.getElementById('dishForm');
const modalTitle = document.getElementById('modalTitle');
const btnCancelModal = document.getElementById('btnCancelModal');

// Form Fields
const dishId = document.getElementById('dishId');
const dishName = document.getElementById('dishName');
const dishImageInput = document.getElementById('dishImageInput');
const dishImagePreview = document.getElementById('dishImagePreview');
const dishImageBase64 = document.getElementById('dishImageBase64');
const dishPrice = document.getElementById('dishPrice');
const dishCategory = document.getElementById('dishCategory');
const dishDesc = document.getElementById('dishDesc');
const dishIngredients = document.getElementById('dishIngredients');
const dishAvailable = document.getElementById('dishAvailable');
const dishPopular = document.getElementById('dishPopular');

// Delete Modal
const deleteModal = document.getElementById('deleteModal');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
let dishToDeleteId = null;

// State
let currentDishes = [];

// INIT
function init() {
    setupNavigation();
    setupEventListeners();
    loadDashboardStats();
    loadDishesTable();
    loadOrders(); // Load orders initially too just in case

    // Interval to refresh orders and timers every 3s
    setInterval(loadOrders, 3000);

    // Auto-refresh when localStorage changes in another tab
    window.addEventListener('storage', (e) => {
        if (e.key === 'pokecafe_menu' || e.key === 'restaurant_orders') {
            loadDashboardStats();
            loadDishesTable();
            loadOrders();
        }
    });
}

// NAVIGATION
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const target = item.dataset.target;
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            if (target === 'dashboard') loadDashboardStats();
            if (target === 'manage') loadDishesTable();
            if (target === 'orders') loadOrders();
        });
    });
}

// DASHBOARD
function loadDashboardStats() {
    const all = getMenu();
    const available = getAvailableItems().length;

    statTotal.textContent = all.length;
    statAvailable.textContent = available;
    statUnavailable.textContent = all.length - available;
}

// TABLE
function loadDishesTable() {
    let query = searchInput.value.trim();
    let category = categoryFilter.value;

    if (query) {
        currentDishes = searchItems(query);
    } else {
        currentDishes = getMenu();
    }

    if (category !== 'all') {
        currentDishes = currentDishes.filter(d =>
            d.category.toLowerCase() === category.toLowerCase()
        );
    }

    renderTable();
}

function renderTable() {
    dishesTableBody.innerHTML = '';

    if (currentDishes.length === 0) {
        dishesTableBody.innerHTML =
            `<tr><td colspan="7" style="text-align:center;">No dishes found</td></tr>`;
        return;
    }

    currentDishes.forEach(dish => {
        const tr = document.createElement('tr');
        const imgPath = dish.image || 'assets/placeholder.jpg';

        tr.innerHTML = `
            <td style="text-align:center;"><img src="${imgPath}" class="admin-dish-img" alt="Dish"></td>
            <td>${dish.name}</td>
            <td>${dish.category}</td>
            <td>₹${dish.price}</td>
            <td>${dish.popular ? 'Yes' : 'No'}</td>
            <td>
                <input type="checkbox" class="toggle" data-id="${dish.id}" ${dish.available ? 'checked' : ''}>
            </td>
            <td>
                <button class="edit" data-id="${dish.id}">Edit</button>
                <button class="delete" data-id="${dish.id}">Delete</button>
            </td>
        `;

        dishesTableBody.appendChild(tr);
    });

    attachTableEvents();
}

// EVENTS
function setupEventListeners() {
    searchInput.addEventListener('input', loadDishesTable);
    categoryFilter.addEventListener('change', loadDishesTable);

    btnAddDish.addEventListener('click', openAddModal);
    btnCancelModal.addEventListener('click', closeModal);
    btnCancelDelete.addEventListener('click', closeDeleteModal);

    dishForm.addEventListener('submit', handleFormSubmit);
    btnConfirmDelete.addEventListener('click', handleConfirmDelete);

    dishImageInput.addEventListener('change', handleImageUpload);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            dishImageBase64.value = event.target.result;
            dishImagePreview.src = event.target.result;
            dishImagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function attachTableEvents() {
    document.querySelectorAll('.edit').forEach(btn => {
        btn.onclick = () => openEditModal(Number(btn.dataset.id));
    });

    document.querySelectorAll('.delete').forEach(btn => {
        btn.onclick = () => openDeleteModal(Number(btn.dataset.id));
    });

    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.onchange = () => {
            toggleAvailability(Number(toggle.dataset.id));
            loadDashboardStats();
        };
    });
}

// MODALS
function openAddModal() {
    dishForm.reset();
    dishId.value = '';
    dishImageInput.value = '';
    dishImageBase64.value = '';
    dishImagePreview.src = '';
    dishImagePreview.style.display = 'none';
    modalTitle.textContent = 'Add Dish';
    dishModal.classList.add('active');
}

function openEditModal(id) {
    const d = getItemById(id);
    if (!d) return;

    dishId.value = d.id;
    dishName.value = d.name;
    
    dishImageInput.value = '';
    dishImageBase64.value = d.image || '';
    if (d.image) {
        dishImagePreview.src = d.image;
        dishImagePreview.style.display = 'block';
    } else {
        dishImagePreview.src = '';
        dishImagePreview.style.display = 'none';
    }
    
    dishPrice.value = d.price;
    dishCategory.value = d.category;
    dishDesc.value = d.desc;
    dishIngredients.value = d.ingredients.join(', ');
    dishAvailable.checked = d.available;
    dishPopular.checked = d.popular;

    modalTitle.textContent = 'Edit Dish';
    dishModal.classList.add('active');
}

function closeModal() {
    dishModal.classList.remove('active');
}

function openDeleteModal(id) {
    dishToDeleteId = id;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
}

// ACTIONS
function handleFormSubmit(e) {
    e.preventDefault();

    const data = {
        name: dishName.value,
        image: dishImageBase64.value,
        price: Number(dishPrice.value),
        category: dishCategory.value,
        desc: dishDesc.value,
        ingredients: dishIngredients.value.split(',').map(i => i.trim()),
        available: dishAvailable.checked,
        popular: dishPopular.checked
    };

    if (dishId.value) {
        data.id = Number(dishId.value);
        updateItem(data);
    } else {
        addItem(data);
    }

    closeModal();
    loadDishesTable();
    loadDashboardStats();
}

function handleConfirmDelete() {
    deleteItem(dishToDeleteId);
    closeDeleteModal();
    loadDishesTable();
    loadDashboardStats();
}

// ORDERS LOGIC
function loadOrders() {
    // Skip heavy DOM updates if orders tab is not active
    const ordersTab = document.getElementById('orders');
    if (ordersTab && !ordersTab.classList.contains('active')) return;

    const orders = getOrders();
    const activeOrdersList = document.getElementById('activeOrdersList');
    const completedOrdersList = document.getElementById('completedOrdersList');
    const statIncome = document.getElementById('stat-income');
    const topDishesList = document.getElementById('topDishesList');

    if (!activeOrdersList || !completedOrdersList) return;

    activeOrdersList.innerHTML = '';
    completedOrdersList.innerHTML = '';

    const active = orders.filter(o => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready');
    const completed = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

    // Sort descending by creation date
    active.sort((a, b) => b.createdAt - a.createdAt);
    completed.sort((a, b) => b.createdAt - a.createdAt);

    active.forEach(o => activeOrdersList.appendChild(createOrderCard(o)));
    completed.forEach(o => completedOrdersList.appendChild(createOrderCard(o)));

    if (active.length === 0) activeOrdersList.innerHTML = '<p>No active orders.</p>';
    if (completed.length === 0) completedOrdersList.innerHTML = '<p>No completed orders.</p>';

    if (statIncome) statIncome.textContent = '₹' + getIncome().toFixed(2);

    // Top 10
    if (topDishesList) {
        topDishesList.innerHTML = '';
        const topIds = getTopPopularDishes(10);
        topIds.forEach((id, index) => {
            const dish = getItemById(id);
            if (dish) {
                const li = document.createElement('li');
                li.innerHTML = `<span class="top-dish-rank">#${index + 1}</span> <span>${dish.name}</span>`;
                topDishesList.appendChild(li);
            }
        });
        if (topIds.length === 0) {
            topDishesList.innerHTML = '<li>No data yet</li>';
        }
    }
}

function createOrderCard(order) {
    const div = document.createElement('div');
    div.className = `order-card ${order.status}`;
    
    let itemsHtml = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
    
    const secondsSince = Math.floor((Date.now() - order.createdAt) / 1000);
    const mins = Math.floor(secondsSince / 60);
    const secs = secondsSince % 60;
    const timeStr = `${mins}m ${secs}s`;

    let actionHtml = '';
    if (order.status === 'placed') {
        actionHtml = `<button class="btn-primary update-order-btn" style="padding: 0.5rem 1rem;" data-id="${order.orderId}" data-status="preparing">Start Preparing</button>`;
    } else if (order.status === 'preparing') {
        actionHtml = `<button class="btn-primary update-order-btn" style="padding: 0.5rem 1rem; background-color: #2ecc71;" data-id="${order.orderId}" data-status="ready">Mark Ready</button>`;
    } else if (order.status === 'ready') {
        actionHtml = `<span style="color: #2ecc71; font-weight: 500;">Waiting for Customer</span>`;
    } else if (order.status === 'completed') {
        actionHtml = `<span style="color: #95a5a6; font-weight: 500;">✓ Completed</span>`;
    } else if (order.status === 'cancelled') {
        actionHtml = `<span style="color: #e74c3c; font-weight: 500;">✗ Cancelled</span>`;
    }

    div.innerHTML = `
        <div class="order-header">
            <div>
                <span style="margin-right: 1rem;">Order #${String(order.orderId).slice(-4)}</span>
                <span class="order-status-badge ${order.status}">${order.status}</span>
            </div>
            <span>Table: ${order.tableId}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
            <div>
                <strong>Total:</strong> ₹${order.total}<br>
                <small style="color: #7f8c8d;">Time elapsed: ${timeStr}</small>
            </div>
            <div>${actionHtml}</div>
        </div>
    `;

    return div;
}

document.addEventListener('click', e => {
    if (e.target.classList.contains('update-order-btn')) {
        const id = Number(e.target.dataset.id);
        const status = e.target.dataset.status;
        updateOrderStatus(id, status);
        loadOrders();
    }
});

// START
init();