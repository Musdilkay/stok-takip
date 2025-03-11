import Product from "../models/Product.js";

// 📌 Ürün satıldığında stokları güncelleyen fonksiyon
export const sellProduct = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Ana ürünü bul
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Ürün bulunamadı" });
        }

        // Eğer stok yetersizse hata döndür
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Yetersiz stok" });
        }

        // Ana ürünün stok miktarını güncelle
        product.stock -= quantity;
        await product.save();

        // Bağlı ürünleri güncelle
        for (const linked of product.linkedProducts) {
            const linkedProduct = await Product.findById(linked.productId);
            if (linkedProduct) {
                linkedProduct.stock -= linked.amount * quantity; // Bağlı ürün miktarı kadar azalt
                await linkedProduct.save();
            }
        }

        res.json({ message: "Satış işlemi başarılı", product });
    } catch (error) {
        res.status(500).json({ message: "Bir hata oluştu", error });
    }
};
