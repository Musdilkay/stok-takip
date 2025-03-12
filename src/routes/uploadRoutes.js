import express from "express"
import multer from "multer"
import ExcelJS from "exceljs"
import Product from "../models/Product.js"

const router = express.Router();
const upload = multer({storage: multer.memoryStorage() }); //Bellekte sakla. dosya kaydetme

//CSV/Excel dosyası yükleme ve stok güncelleme

router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if(!req.file) {
            return res.status(400).json({message: "Dosya yüklenmedi"});
        }

        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];


        let updatedCount = 0
        let errors = [];

        for ( let i = 2; i <= worksheet.rowCount; i++) { // 2.satırdan itibaren
            const row = worksheet.getRow(i);
            const sku = row.getCell(1).value;// sku veya ıd
            const newStock = row.getCell(2).value; // yeni stok

            if(!sku || !newStock0) {
                errors.push({ row: i, message:"SKU veya stok bilgisi eksik"});
            }

            const product = await Product.findOne({ sku }); //SKU'ya göre ara
            if (product) {
                product.stock = newStock;
                await product.save() ;
                updatedCount++;
            } else {
                errors.push({ row: i, message : `Ürün bulunamadı: ${sku}`})
            }

        }
        res.json ({ message: `Başarıyla güncellenen ürün sayısı: ${updatedCount}`, errors});
    } catch (error) {
        console.error("Hata:", error);
        res.status(500).json({message: "İşlem sırasında hata oluştu"})
    }
});

export default router;
