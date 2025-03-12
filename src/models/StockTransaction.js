import mongoose from "mongoose";

const stockTransactionSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    transactionType: { type: String, enum: ["sale", "return", "manual"], required: true },
    date: { type: Date, default: Date.now }
});

const StockTransaction = mongoose.model("StockTransaction", stockTransactionSchema);

export default StockTransaction;
