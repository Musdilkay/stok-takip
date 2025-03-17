import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { admin, adminRouter } from './admin.js';
import transactionRoutes from './routes/transactionRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import pdfkit from 'pdfkit';
import fs from 'fs';
import path from 'path';
import StockTransaction from './models/StockTransaction.js';
import { checkLowStock } from './utils/notifications.js';

dotenv.config();

const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Bağlantısı
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stok-takip';
mongoose
  .connect(mongoUri, {})
  .then(() => console.log('✅ MongoDB bağlantısı başarılı!'))
  .catch((err) => console.error('❌ MongoDB bağlantı hatası:', err));

// API Route'ları
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Her saat başı düşük stokları kontrol etme
setInterval(checkLowStock, 3600000);

// PDF Raporu Oluşturma
app.get('/api/report/pdf', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Stok hareketlerini al (tarih aralığına göre)
    const transactions = await StockTransaction.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    if (!transactions.length) {
      return res.status(404).json({ message: 'Veri bulunamadı!' });
    }

    // PDF oluşturma
    const doc = new pdfkit();
    const filePath = path.join(__dirname, 'reports', 'stock_report.pdf');
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text(`Stok Raporu (${startDate} - ${endDate})`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('------------------------------------------------------------');

    // Rapor satırlarını yaz
    transactions.forEach((transaction) => {
      doc.text(`Ürün: ${transaction.product.name}, Miktar: ${transaction.quantity}, Tarih: ${transaction.date}`);
    });

    doc.end();

    // Raporu indirilebilir olarak sun
    res.download(filePath, 'stock_report.pdf', (err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'PDF raporu indirilemedi.' });
      } else {
        // PDF dosyasını sil (isteğe bağlı)
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Rapor oluşturulamadı!' });
  }
});

// AdminJS Paneli
app.use(admin.options.rootPath, adminRouter);

// Hata Yönetimi Middleware'i
app.use((err, req, res, next) => {
  console.error('Hata:', err);
  res.status(500).json({ message: 'Sunucu hatası!', error: err.message });
});

// Sunucuyu Başlat
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
  console.log(`🔧 AdminJS Paneli: http://localhost:${PORT}/admin`);
});
