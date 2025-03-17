import Notification from "../models/Notification.js";
import Product from "../models/Product.js";


export const checkLowStock = async () => {
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } }); // 5 in altına düştüyse 
    for (const product of lowStockProducts) {
        await Notification.create({
            message: `Düşük Stok Uyarısı: ${product.name} (${product.stock} adet kaldı)`,
            type: "lowStock",
        });
    }
};