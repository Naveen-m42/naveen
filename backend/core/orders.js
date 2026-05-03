const ORDERS_KEY = "restaurant_orders";

// Helper to get raw data
function getOrdersData() {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
}

// Helper to save raw data
function setOrdersData(data) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
}

export function getOrders() {
    return getOrdersData();
}

export function placeOrder(cart, tableId, total) {
    const orders = getOrdersData();
    const now = Date.now();
    const newOrder = {
        orderId: now, // Unique generated using Date.now()
        tableId: String(tableId),
        items: cart,
        total: Number(total),
        status: "placed", // Placed -> Preparing -> Ready -> Completed
        createdAt: now,
        updatedAt: now
    };
    orders.push(newOrder);
    setOrdersData(orders);
    return newOrder;
}

export function updateOrderStatus(orderId, status) {
    const orders = getOrdersData();
    const index = orders.findIndex(o => o.orderId === orderId);
    if (index !== -1) {
        orders[index].status = status;
        orders[index].updatedAt = Date.now();
        setOrdersData(orders);
        return true;
    }
    return false;
}

// Keeping this for backwards compatibility if needed, but it should be replaced
export function addOrder(cart, tableNumber, total) {
    return placeOrder(cart, tableNumber, total);
}

// Keep completeOrder for backwards compatibility
export function completeOrder(orderId) {
    return updateOrderStatus(orderId, "completed");
}

export function getIncome() {
    const orders = getOrdersData();
    return orders
        .filter(o => o.status === "completed")
        .reduce((sum, order) => sum + order.total, 0);
}

export function getTopPopularDishes(limit = 10) {
    const orders = getOrdersData();
    const counts = {};

    // Calculate from all valid orders (not cancelled)
    orders.filter(o => o.status !== "cancelled").forEach(order => {
        order.items.forEach(item => {
            counts[item.id] = (counts[item.id] || 0) + item.qty;
        });
    });

    const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return sortedIds.slice(0, limit).map(Number);
}
