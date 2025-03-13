import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { admin, adminRouter } from './admin.js'; // AdminJS dosyanızı içe aktarın
import transactionRoutes from './routes/transactionRoutes.js';
import productRoutes from './routes/productRoutes.js';  // Ürünler için route ekleyelim

dotenv.config();

// MongoDB bağlantısı
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stok-takip'; // Çevresel değişken kullanımı
mongoose.connect(mongoUri, {
  
})
  .then(() => console.log('MongoDB bağlantısı başarılı!'))
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

const app = express();

// Middleware'ler
app.use(express.json()); // JSON formatında veri alabilmek için
app.use(express.urlencoded({ extended: true })); // URL encoded veri desteği için

// API route'ları
app.use("/api/transactions", transactionRoutes);  // İşlem rotası
app.use("/api/products", productRoutes);          // Ürün rotası (Eğer varsa, ürünler için routes eklemelisiniz)

// AdminJS rotasını ekle
app.use(admin.options.rootPath, adminRouter);

// Sunucuyu başlat
const PORT = process.env.PORT || 5008;  // Çevresel değişken ile port seçimi
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
  console.log(`AdminJS paneli: http://localhost:${PORT}/admin`);
});
