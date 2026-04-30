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
    getAvailableItems
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
            `<tr><td colspan="6" style="text-align:center;">No dishes found</td></tr>`;
        return;
    }

    currentDishes.forEach(dish => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
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
    modalTitle.textContent = 'Add Dish';
    dishModal.classList.add('active');
}

function openEditModal(id) {
    const d = getItemById(id);
    if (!d) return;

    dishId.value = d.id;
    dishName.value = d.name;
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

// START
init();