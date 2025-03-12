import { Product } from "../models/Product.js"

export const updateStock = async (productId, quantity) => {
    try {
        const product = await Product.findById(productId);
        if(!product) {
            return { success: false, message: "Ürün Bulunamadı"};
        }

        // Yeni Stok Miktarını hesapla
        product.stock -= quantity;

        //Kritik Stok Seviyesi kontrolü
        let alertMessage = "";
        if(product.stock < product.minStockLevel) {
            alertMessage = `⚠️ Uyarı: ${product.name} stoğu kritik seviyeye düştü!`;
            console.log(alertMessage); 
        }
        await product.save();

        return { success: true, message: "Stok güncellendi", alert: alertMessage };
      } catch (error) {
        return { success: false, message: error.message };
      }
    };