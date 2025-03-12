import express from "express";
import StockTransaction from "../models/StockTransaction.js";

const router = express.Router();

//Tüm Stok hareketlerini getir

router.get("/", async (req, res) => {
    try {
        const transactions = await StockTransaction.find().populate("productId", "name sku");
        res.json(transactions);
    } catch (error) {
        res.status(500).json({message: "Stok hareketleri getirilmedi", error: error.message});
    }
});

export default router; 