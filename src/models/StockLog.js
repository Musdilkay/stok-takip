import mongoose from "mongoose";

// Eğer User modelini kullanıyorsan içe aktar:
import User from "./User.js"; // Eğer böyle bir dosyan yoksa, aşağıdaki satırı kaldır.

const StockLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Buradaki hatayı düzelttik
  oldStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  changeAmount: { type: Number, required: true },
  actionType: { type: String, enum: ["manual", "order", "return"], required: true },
  createdAt: { type: Date, default: Date.now },
});

const StockLog = mongoose.model("StockLog", StockLogSchema);
export default StockLog;
