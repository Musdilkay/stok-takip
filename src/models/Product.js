import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  price: { type: Number, required: true },
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }] // 🔥 Yan ürünler
});

const Product = mongoose.model("Product", ProductSchema);
export default Product;
