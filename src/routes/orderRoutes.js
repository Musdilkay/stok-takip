import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { createOrder } from "../controllers/orderController.js";


const router = express.Router();

router.post("/", createOrder);

// 📌 1. Yeni Sipariş Oluştur
router.post("/", async (req, res) => {
  try {
    const { customerName, customerEmail, products } = req.body;

    let totalAmount = 0;
    const productUpdates = [];

    for (let item of products) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ message: `Stok yetersiz: ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      product.stock -= item.quantity;
      productUpdates.push(product.save());
    }

    await Promise.all(productUpdates);

    const newOrder = new Order({ customerName, customerEmail, products, totalAmount });
    await newOrder.save();

    res.status(201).json({ message: "Sipariş başarıyla oluşturuldu!", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "Sipariş oluşturulamadı!", error: error.message });
  }
});

// 📌 2. Tüm Siparişleri Getir
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("products.productId", "name price");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Siparişler getirilemedi!", error: error.message });
  }
});

// 📌 3. Tek Bir Siparişi Getir
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("products.productId", "name price");
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı!" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Sipariş getirilemedi!", error: error.message });
  }
});

// 📌 4. Sipariş Durumunu Güncelle
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı!" });

    res.json({ message: "Sipariş durumu güncellendi!", order });
  } catch (error) {
    res.status(500).json({ message: "Sipariş durumu güncellenemedi!", error: error.message });
  }
});

// 📌 5. Siparişi Sil
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: "Sipariş bulunamadı!" });

    res.json({ message: "Sipariş silindi!" });
  } catch (error) {
    res.status(500).json({ message: "Sipariş silinemedi!", error: error.message });
  }
  
  

  
});

export default router;
