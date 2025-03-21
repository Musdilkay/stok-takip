import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: { type: String, enum: ["stockUpdate", "order", "other"], required: true },
    isRead: { type: Boolean, default: false }, // ✅ Bildirimin okunup okunmadığını takip edelim
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
