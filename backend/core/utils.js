export function generateId() {
    return Date.now();
}

export function normalizeString(str) {
    return (str || "").toString().trim().toLowerCase();
}

export function formatPrice(price) {
    return `₹${Number(price || 0).toFixed(2)}`;
}