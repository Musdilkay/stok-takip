import mongoose from "mongoose";
import Notification from "./Notification.js"; // Bildirim Modeli Eklendi


const OrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },

    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Beklemede", "Hazırlanıyor", "Kargoya Verildi", "Teslim Edildi"],
      default: "Beklemede",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🔔 **Yeni sipariş oluşturulduğunda bildirim ekleyelim**
OrderSchema.post("save", async function (doc) {
  try {
    console.log("🛎️ Yeni sipariş bildirimi oluşturuluyor...");
    
    const newNotification = new Notification({
      message: `📦 Yeni sipariş var: ${doc.customerName} (${doc.totalPrice} TL)`,
      type: "order",
    });

    await newNotification.save();
    console.log("✅ Bildirim başarıyla kaydedildi!");

  } catch (error) {
    console.error("❌ Bildirim eklenirken hata oluştu:", error);
  }
});

const Order = mongoose.model("Order", OrderSchema);
export default Order;
