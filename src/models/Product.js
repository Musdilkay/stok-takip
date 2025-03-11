import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    stock: { type: Number, required: true },
    linkedProducts: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            amount: { type: Number, required: true }
        }
    ]
});

const Product = mongoose.model("Product", ProductSchema);
export default Product; // ES Modules için default export