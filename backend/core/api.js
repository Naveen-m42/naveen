import { getData, setData } from "./data.js";
import { generateId, normalizeString } from "./utils.js";

export function getMenu() {
    return getData();
}

export function getItemById(id) {
    return getData().find(item => item.id === id) || null;
}

export function addItem(item) {
    const menu = getData();

    const newItem = {
        id: generateId(),
        name: item.name,
        price: Number(item.price),
        category: normalizeString(item.category), // ✅ FIXED
        image: item.image || "",
        available: item.available ?? true,
        popular: item.popular ?? false,
        desc: item.desc || "",
        ingredients: item.ingredients || []
    };

    menu.push(newItem);
    setData(menu);
    return newItem;
}

export function updateItem(updatedItem) {
    const menu = getData();
    const index = menu.findIndex(item => item.id === updatedItem.id);

    if (index === -1) return null;

    menu[index] = {
        ...menu[index],
        ...updatedItem,
        category: updatedItem.category
            ? normalizeString(updatedItem.category)
            : menu[index].category // ✅ keep old if not updated
    };

    setData(menu);
    return menu[index];
}

export function deleteItem(id) {
    const menu = getData();
    const filtered = menu.filter(item => item.id !== id);

    if (filtered.length === menu.length) return false;

    setData(filtered);
    return true;
}

export function toggleAvailability(id) {
    const menu = getData();
    const item = menu.find(item => item.id === id);

    if (!item) return null;

    item.available = !item.available;
    setData(menu);
    return item;
}

export function filterByCategory(category) {
    const c = normalizeString(category);
    return getData().filter(item =>
        normalizeString(item.category) === c
    );
}

export function searchItems(query) {
    const q = normalizeString(query);

    return getData().filter(item =>
        normalizeString(item.name).includes(q) ||
        normalizeString(item.desc).includes(q) ||
        item.ingredients.some(ing =>
            normalizeString(ing).includes(q)
        )
    );
}

export function getAvailableItems() {
    return getData().filter(item => item.available);
}