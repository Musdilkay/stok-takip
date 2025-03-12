import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, default: 0 },
  linkedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

const Product = mongoose.model('Product', productSchema);

export default Product;
