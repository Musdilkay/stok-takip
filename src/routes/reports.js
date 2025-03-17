import express from "express";
import Product from "../models/Product.js"; // Doğru göreceli yol ve .js uzantısı
import xlsx from "xlsx";
import fs from "fs";
import path from "path";

const router = express.Router();

const reportsDir = path.join(process.cwd(), "reports");
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
}

// JSON formatında stok raporu oluşturma
router.get("/json", async (req, res) => {
    try {
        const products = await Product.find({}, "name sku stock");
        res.json({ message: "Rapor Oluşturuldu!", data: products });
    } catch (error) {
        res.status(500).json({ message: "Rapor Oluşturulamadı!", error: error.message });
    }
});

// Excel Formatında Stok Raporu oluşturma ve indirme
router.get("/excel", async (req, res) => {
    try {
        const products = await Product.find({}, "name sku stock");

        // Excel dosyası oluşturma
        const workbook = xlsx.utils.book_new(); // workbook küçük harfle
        const worksheet = xlsx.utils.json_to_sheet(products); // products verisini worksheet'e dönüştür
        xlsx.utils.book_append_sheet(workbook, worksheet, "Stok Raporu");

        // Dosyayı Kaydetme ve İndirme
        const filePath = "./reports/stock_report.xlsx";
        xlsx.writeFile(workbook, filePath);

        res.download(filePath, "stok_raporu.xlsx", (err) => {
            if (err) {
                res.status(500).send({ message: "Dosya İndirilemedi", error: err.message });
            } else {
                fs.unlinkSync(filePath); // Dosyayı sunucudan sil
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Excel raporu oluşturulamadı", error: error.message });
    }
});

export default router;