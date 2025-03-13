import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: String,
    sku: String,
    stock: Number,
    linkedProducts: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            amount: Number
        }
    ]
});

const Product = mongoose.model("Product", productSchema);

export default Product; // ✨ `export { Product };` yerine `export default Product;` kullanıyoruz.
