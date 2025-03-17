import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    message: { type:String, required: true },
    type: {type: String, enum:["lockStock", "newOrder"], required: true},
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);