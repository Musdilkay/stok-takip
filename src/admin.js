import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import express from "express";
import fileUpload from "express-fileupload";
import xlsx from "xlsx";
import session from "express-session";  // 🛠 Oturum yönetimi için eklendi
import bcrypt from "bcryptjs";
import Product from "./models/Product.js";
import StockTransaction from "./models/StockTransaction.js";
import Notification from "./models/Notification.js";
import User from "./models/User.js";
import { adminOnlyMiddleware } from "./middlewares/authMiddleware.js"; // ✅ Admin yetkilendirme middleware'i

AdminJS.registerAdapter(AdminJSMongoose);

const app = express();
app.use(fileUpload());

const admin = new AdminJS({
  resources: [
    {
      resource: Product,
      options: {
        parent: { name: "Ürün Yönetimi" },
        actions: {
          bulkUpdateStock: {
            actionType: "resource",
            label: "Toplu Stok Güncelleme",
            icon: "Upload",
            component: false,
            handler: async (request, response, context) => {
              if (request.method === "post") {
                const { file } = request.payload;
                if (!file) {
                  return { message: "Lütfen bir dosya yükleyin!", status: "error" };
                }

                const workbook = xlsx.read(file.buffer, { type: "buffer" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(sheet);

                const updatedProducts = [];
                for (const row of data) {
                  const productId = row.productId;
                  const stock = row.stock;
                  const product = await Product.findById(productId);

                  if (product) {
                    product.stock = stock;
                    await product.save();
                    updatedProducts.push(product);

                    await Notification.create({
                      message: `Ürünün stoğu güncellendi: ${product.name}`,
                      type: "stockUpdate",
                    });
                  } else {
                    return {
                      message: `Ürün bulunamadı: ${productId}`,
                      status: "error",
                    };
                  }
                }

                return {
                  message: `${updatedProducts.length} ürün başarıyla güncellendi!`,
                  status: "success",
                };
              }

              return {
                message: "Dosyayı yükleyerek stokları güncelleyebilirsiniz.",
                status: "info",
              };
            },
          },
        },
      },
    },
    {
      resource: StockTransaction,
      options: { parent: { name: "Stok Hareketleri" } },
    },
    {
      resource: Notification,
      options: {
        parent: { name: "Bildirimler" },
        listProperties: ["message", "type", "createdAt"],
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: false },
        },
      },
    },
    {
      resource: User,
      options: {
        parent: { name: "Kullanıcı Yönetimi" },
        listProperties: ["username", "email", "role"],
        editProperties: ["role", "password"], // ✅ Şifreyi admin değiştirebilir hale getirdik
        showProperties: ["username", "email", "role"],
        actions: {
          edit: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(request.payload.password, 10); // ✅ Şifreyi hashle
              }
              return request;
            },
          },
          list: { before: adminOnlyMiddleware },
          delete: { before: adminOnlyMiddleware },
          new: { isAccessible: false },
        },
      },
    },
  ],
  rootPath: "/admin",
});

// 📌 **Admin Oturum Açma (Login) İçin Fonksiyon**
const authenticateAdmin = async (email, password) => {
  const adminUser = await User.findOne({ email, role: "admin" });
  if (adminUser && bcrypt.compareSync(password, adminUser.password)) {
    return adminUser;
  }
  return null;
};

// 📌 **AdminJS Router'ını Oturum Yönetimi ile Kuruyoruz**
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: async (email, password) => {
      return await authenticateAdmin(email, password);
    },
    cookieName: "admin-session",
    cookiePassword: "supersecret-password",
  },
  null,
  {
    resave: false,
    saveUninitialized: true,
    secret: "session-secret-key",
    store: new session.MemoryStore(),
  }
);

export { admin, adminRouter };
