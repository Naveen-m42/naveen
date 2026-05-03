import express from "express";
import cors from "cors";
import {
    getMenu,
    addItem,
    deleteItem
} from "./api.js";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get("/menu", (req, res) => {
    res.json(getMenu());
});

app.post("/menu", (req, res) => {
    const newItem = addItem(req.body);
    res.json(newItem);
});

app.delete("/menu/:id", (req, res) => {
    const success = deleteItem(req.params.id);
    res.json({ success });
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});