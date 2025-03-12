import express from 'express';
import Product from '../models/Product.js'; // 'Product' modelini ES Modules olarak import et
import { sellProduct } from "../controllers/productController.js";
const router = express.Router();

router.post("/sell", sellProduct);

// 1. Tüm Ürünleri getir
router.get("/", async (req, res) => {
    try {
        const products = await Product.find(); 
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Ürünler getirilemedi", error: error.message });
    }
});

// 2. Yeni Ürün Ekle
router.post("/", async (req, res) => {
    try {
        const { name, sku, stock, linkedProducts } = req.body;
        const newProduct = new Product({ name, sku, stock, linkedProducts });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Ürün Eklenemedi", error: error.message });
    }
});

// 3. Ürünü güncelle 
router.put("/:id", async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Ürün bulunamadı" });
        }

        res.json(updatedProduct);
    } catch (error) {
        console.error("Ürün güncelleme hatası:", error);
        res.status(500).json({ message: "Ürün güncellenemedi", error: error.message });
    }
});

// 4. Ürünü Sil
router.delete("/:id", async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Ürün bulunamadı" });
        }
        res.json({ message: "Ürün silindi" });
    } catch (error) {
        res.status(500).json({ message: "Ürün silinemedi", error: error.message });
    }
});

// Satış işlemi
import StockTransaction from "../models/StockTransaction.js";

router.put("/sell/:id", async (req, res) => {
    try {
        const { quantity } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Ürün bulunamadı" });
        }

        // Ana ürün stok güncelleme
        product.stock -= quantity;

        // Stok hareketi kaydı oluşturma
        await StockTransaction.create({
            productId: product._id,
            quantity: quantity,
            transactionType: "sale"
        });

        // Bağlı ürünlerin stoklarını da düşelim
        for (let linkedProduct of product.linkedProducts) {
            const subProduct = await Product.findOne({ _id: linkedProduct.productId });

            if (subProduct) {
                subProduct.stock -= linkedProduct.amount * quantity;

                // Bağlı ürünler için de stok hareketi kaydedelim
                await StockTransaction.create({
                    productId: subProduct._id,
                    quantity: linkedProduct.amount * quantity,
                    transactionType: "sale"
                });

                await subProduct.save();
            }
        }

        await product.save();
        res.json({ message: "Stok başarıyla güncellendi", product });

    } catch (error) {
        res.status(500).json({ message: "Stok güncellenemedi", error: error.message });
    }
});


export default router; // Burada 'default' olarak export ediyoruz
