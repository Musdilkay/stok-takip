import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import { admin, adminRouter } from "./admin.js";
import productRoutes from "./routes/productRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use(fileUpload()); // 📌 Dosya yükleme middleware'ini ekledik

// AdminJS paneli için route
app.use(admin.options.rootPath, adminRouter);

// API route'ları
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 5008;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(err));
