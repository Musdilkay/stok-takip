import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';
import adminRouter from './admin.js'; // Admin panelini dahil et

dotenv.config();

const app = express();
const port = process.env.PORT || 5008;

app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/admin', adminRouter); // Admin panel rotasını ekle

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});