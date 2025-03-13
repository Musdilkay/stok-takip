import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { admin, adminRouter } from "./admin.js"; 
import transactionRoutes from "./routes/transactionRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// 📌 Middleware'ler
app.use(cors()); // CORS desteği
app.use(express.json()); // JSON formatında veri alabilmek için
app.use(express.urlencoded({ extended: true })); // URL encoded veri desteği için

// 📌 MongoDB Bağlantısı
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/stok-takip";
mongoose
  .connect(mongoUri, {
   
  })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı!"))
  .catch((err) => console.error("❌ MongoDB bağlantı hatası:", err));

// 📌 API Route'ları
app.use("/api/auth", authRoutes); // Kullanıcı yetkilendirme
app.use("/api/transactions", transactionRoutes); // İşlem rotası
app.use("/api/products", productRoutes); // Ürün rotası

// 📌 AdminJS Paneli
app.use(admin.options.rootPath, adminRouter);

// 📌 Hata Yönetimi Middleware'i
app.use((err, req, res, next) => {
  console.error("Hata:", err);
  res.status(500).json({ message: "Sunucu hatası!", error: err.message });
});

// 📌 Sunucuyu Başlat
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`🔧 AdminJS Paneli: http://localhost:${PORT}/admin`);
});
