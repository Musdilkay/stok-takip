import StockLog from "../models/StockLog.js"; // Stok log modelini içe aktar

const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("products.product");

    if (!order) {
      return res.status(404).json({ message: "Sipariş bulunamadı!" });
    }

    for (const item of order.products) {
      const product = item.product;
      const oldStock = product.stock;
      const newStock = oldStock - item.quantity;

      if (newStock < 0) {
        return res.status(400).json({ message: `Stok yetersiz: ${product.name}` });
      }

      product.stock = newStock;
      await product.save();

      // Stok hareketini logla
      await StockLog.create({
        product: product._id,
        changedBy: req.user._id, // Siparişi kim tamamlarsa
        oldStock,
        newStock,
        changeAmount: -item.quantity,
        actionType: "order",
      });
    }

    order.status = "completed";
    await order.save();

    res.json({ message: "Sipariş başarıyla tamamlandı!" });
  } catch (error) {
    res.status(500).json({ message: "Sipariş işlenirken hata oluştu." });
  }
};
