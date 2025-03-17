import express from "express";
import StockTransaction from "../models/StockTransaction.js"; // Stok hareket modeli
import xlsx from "xlsx";
import fs from "fs";
import path from "path";

const router = express.Router();

// 📌 Tarih Aralığına Göre Stok Hareketleri Raporu
router.get("/stock-history", async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Başlangıç ve bitiş tarihleri gereklidir!" });
    }

    // Tarihleri ISO formatına çevir
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Bitiş tarihini gün sonu olarak ayarla

    // MongoDB'den ilgili tarih aralığındaki stok hareketlerini çek
    const transactions = await StockTransaction.find({
      createdAt: { $gte: start, $lte: end },
    }).populate("productId", "name sku");

    if (transactions.length === 0) {
      return res.status(404).json({ message: "Belirtilen tarih aralığında stok hareketi bulunamadı!" });
    }

    if (format === "excel") {
      // 📌 Excel raporu oluştur
      const reportData = transactions.map((tx) => ({
        Ürün_Adı: tx.productId?.name || "Bilinmiyor",
        SKU: tx.productId?.sku || "Bilinmiyor",
        İşlem_Tipi: tx.type,
        Miktar: tx.quantity,
        Tarih: tx.createdAt.toISOString(),
      }));

      // Excel çalışma kitabı oluştur
      const worksheet = xlsx.utils.json_to_sheet(reportData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Stok Raporu");

      // Dosya kaydetme
      const reportsDir = path.join(process.cwd(), "reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir); // Klasör yoksa oluştur
      }

      const filePath = path.join(reportsDir, `stock_report_${Date.now()}.xlsx`);
      xlsx.writeFile(workbook, filePath);

      // Dosyayı istemciye gönder
      return res.download(filePath, "stok_raporu.xlsx", (err) => {
        if (err) {
          console.error("Dosya gönderme hatası:", err);
        }
        fs.unlinkSync(filePath); // Dosyayı silerek temizleme
      });
    } else {
      // 📌 JSON formatında dönüş yap
      res.json({
        message: "Stok hareket raporu oluşturuldu.",
        transactions,
      });
    }
  } catch (error) {
    console.error("Rapor oluşturma hatası:", error);
    res.status(500).json({ message: "Rapor oluşturulamadı!", error: error.message });
  }
});

export default router;
