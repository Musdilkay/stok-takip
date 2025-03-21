import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },      // Müşteri Adı
    customerEmail: { type: String, required: true },     // Müşteri E-posta
    customerPhone: { type: String, required: true },     // Telefon Numarası
    customerAddress: { type: String, required: true },   // Adres

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

const Order = mongoose.model("Order", OrderSchema);
export default Order;
