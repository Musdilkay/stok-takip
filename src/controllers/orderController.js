import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res) => {
  try {
    console.log("📩 [DEBUG] Sipariş API çağrıldı!", req.body);

    const { products } = req.body;
    if (!products || products.length === 0) {
      console.log("❌ [HATA] Siparişte ürün bulunamadı!");
      return res.status(400).json({ message: "Siparişte ürün bulunmalı!" });
    }

    for (const item of products) {
      console.log("🔎 [DEBUG] Ürün ID:", item.product);
      const product = await Product.findById(item.product).populate("relatedProducts");

      if (!product) {
        console.log("❌ [HATA] Ürün veritabanında bulunamadı!", item.product);
        return res.status(404).json({ message: "Ürün bulunamadı!" });
      }

      console.log(`📦 [DEBUG] ${product.name} için stok düşüyor. Önceki stok: ${product.stock}`);
      product.stock -= item.quantity;
      await product.save();
      console.log(`✅ [DEBUG] Yeni stok: ${product.stock}`);

      // 🛠 **Yan ürünlerin de stoklarını güncelle**
      if (product.relatedProducts && product.relatedProducts.length > 0) {
        console.log(`🔗 [DEBUG] ${product.name} için yan ürünler güncelleniyor:`, product.relatedProducts);

        for (const relatedProduct of product.relatedProducts) {
          const subProduct = await Product.findById(relatedProduct._id);
          if (subProduct) {
            console.log(`🛠️ [DEBUG] Yan ürün (${subProduct.name}) stoğu güncelleniyor... Önceki stok: ${subProduct.stock}`);

            // **Eksik `price` alanı için varsayılan değer ata**
            if (subProduct.price === undefined) {
              console.log(`⚠️ [UYARI] Yan ürün (${subProduct.name}) için fiyat eksik, varsayılan 0 atanıyor.`);
              subProduct.price = 0;
            }

            subProduct.stock -= item.quantity;
            await subProduct.save();
            console.log(`🆕 [DEBUG] Yeni stok: ${subProduct.stock}`);
          } else {
            console.log("⚠️ [UYARI] Yan ürün bulunamadı:", relatedProduct._id);
          }
        }
      }
    }

    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log("✅ [DEBUG] Sipariş başarıyla kaydedildi!");

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("🚨 [HATA] Sipariş oluşturulurken hata oluştu:", error);
    res.status(500).json({ message: "Sipariş oluşturulurken hata oluştu!" });
  }
};
