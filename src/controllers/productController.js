import Product from "../models/Product.js";
import { sendOrderReport } from "../utils/emailService.js";

// Ürün Satış Fonksiyonu (Yeni eklenen)
export const sellProduct = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Yetersiz stok" });
    }

    product.stock -= quantity;
    await product.save();

    // Kritik stok kontrolü
    if (product.stock <= product.criticalStockLevel) {
      const subject = `⚠️ Kritik Stok Uyarısı: ${product.name}`;
      const text = `Dikkat! ${product.name} ürününün stoğu ${product.stock} adete düştü.`;
      
      await sendOrderReport("yonetici@site.com", {
        subject,
        text,
        attachments: []
      });
    }

    res.status(200).json({ 
      message: `${quantity} adet ${product.name} satıldı`,
      remainingStock: product.stock
    });

  } catch (error) {
    res.status(500).json({ message: "Satış işlemi başarısız", error: error.message });
  }
};


export async function updateStock(productId, newStock) {

}