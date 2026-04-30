const STORAGE_KEY = "pokecafe_menu";

const defaultMenu = [
    {
        id: 1,
        name: "Spicy Tuna Poke",
        price: 450,
        category: "main",
        image: "",
        available: true,
        popular: true,
        desc: "Fresh tuna, spicy mayo, edamame, cucumber, and crispy onions over sushi rice.",
        ingredients: ["Ahi Tuna", "Sushi Rice", "Spicy Mayo", "Edamame", "Cucumber", "Crispy Onions"]
    },
    {
        id: 2,
        name: "Classic Salmon Bowl",
        price: 480,
        category: "main",
        image: "",
        available: true,
        popular: true,
        desc: "Premium salmon, avocado, mango, sesame seeds with classic ponzu sauce.",
        ingredients: ["Fresh Salmon", "Avocado", "Mango", "Ponzu Sauce", "Sesame Seeds", "Sushi Rice"]
    },
    {
        id: 3,
        name: "Tofu Veggie Delight",
        price: 350,
        category: "main",
        image: "",
        available: true,
        popular: false,
        desc: "Organic marinated tofu, seaweed salad, radish, and carrot ribbons.",
        ingredients: ["Organic Tofu", "Seaweed Salad", "Radish", "Carrots", "Brown Rice", "Sweet Soy Sauce"]
    },
    {
        id: 4,
        name: "Tempura Prawns",
        price: 320,
        category: "starters",
        image: "",
        available: true,
        popular: false,
        desc: "Golden crispy fried prawns served with sweet chilli dip.",
        ingredients: ["Prawns", "Tempura Batter", "Sweet Chilli Sauce", "Lemon"]
    },
    {
        id: 5,
        name: "Steamed Edamame",
        price: 180,
        category: "starters",
        image: "",
        available: false,
        popular: false,
        desc: "Freshly steamed young soybeans lightly tossed in sea salt.",
        ingredients: ["Edamame pods", "Coarse Sea Salt"]
    },
    {
        id: 6,
        name: "Matcha Iced Latte",
        price: 220,
        category: "beverages",
        image: "",
        available: true,
        popular: true,
        desc: "Premium grade matcha layered over cold oat milk and honey.",
        ingredients: ["Matcha Powder", "Oat Milk", "Honey", "Ice"]
    },
    {
        id: 7,
        name: "Lychee Lemonade",
        price: 150,
        category: "beverages",
        image: "",
        available: true,
        popular: false,
        desc: "Refreshing cooler with real lychee chunks and mint.",
        ingredients: ["Fresh Lychee", "Lemon Juice", "Mint", "Soda", "Simple Syrup"]
    },
    {
        id: 8,
        name: "Mango Mochi Ice Cream",
        price: 250,
        category: "desserts",
        image: "",
        available: true,
        popular: false,
        desc: "Soft traditional Japanese rice cake filled with sweet mango ice cream.",
        ingredients: ["Glutinous Rice Flour", "Mango Ice Cream", "Powdered Sugar"]
    }
];

// ✅ ALWAYS returns array (never null)
function getData() {
    let data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMenu));
        return defaultMenu;
    }

    try {
        return JSON.parse(data) || [];
    } catch (e) {
        console.error("Invalid JSON in localStorage. Resetting...");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMenu));
        return defaultMenu;
    }
}

// ✅ Safe setter
function setData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ✅ Optional manual reset (useful for testing)
function resetData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMenu));
}

export { getData, setData, resetData };