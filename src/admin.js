import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import express from "express";
import fileUpload from "express-fileupload";
import xlsx from "xlsx";
import session from "express-session";
import bcrypt from "bcryptjs";
import Product from "./models/Product.js";
import StockTransaction from "./models/StockTransaction.js";
import Notification from "./models/Notification.js";
import User from "./models/User.js";
import { adminOnlyMiddleware } from "./middlewares/authMiddleware.js";

AdminJS.registerAdapter(AdminJSMongoose);

const app = express();
app.use(fileUpload());
app.use(express.static("src/public"));

let isDarkMode = true;

const getTheme = () => {
  return {
    colors: {
      primary100: isDarkMode ? "#1e1e1e" : "#ffffff", // Arka plan koyu renk
      primary80: isDarkMode ? "#282828" : "#f0f0f0",  // İkinci seviye arka plan
      primary60: isDarkMode ? "#3a3a3a" : "#d0d0d0",
      primary40: isDarkMode ? "#4b4b4b" : "#b0b0b0",
      primary20: isDarkMode ? "#5c5c5c" : "#909090",
      grey100: "#000000",  // Yazılar beyaz
      grey80: "#000000",
      grey60: "#000000",
      grey40: "#000000",
      grey20: "#000000",
      grey0: "#000000",
      white: isDarkMode ? "#121212" : "#ffffff", // Arka plan beyaz
      accent: "#ff9800", // Vurgulama rengi
      hoverBg: isDarkMode ? "#333333" : "#e0e0e0",
      inputBg: isDarkMode ? "#222222" : "#f5f5f5", // Input arka planı
      inputBorder: isDarkMode ? "#444444" : "#cccccc", // Input kenar rengi
      inputColor: "#000000", // Input içindeki yazılar siyah
      buttonBg: isDarkMode ? "#444444" : "#e0e0e0", // Butonlar
      buttonColor: "#000000", // Buton yazıları siyah
    },
    fonts: {
      base: "'Roboto', sans-serif",
    },
  };
};

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
        editProperties: ["role", "password"],
        showProperties: ["username", "email", "role"],
        actions: {
          edit: {
            before: async (request) => {
              if (request.payload.password) {
                request.payload.password = await bcrypt.hash(request.payload.password, 10);
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
  branding: {
    companyName: "Stok Takip Sistemi",
    logo: "/e-takip.png",
    theme: getTheme(),
    features: [
      {
        name: "darkModeToggle",
        label: "Dark Mode",
        action: {
          name: "toggleDarkMode",
          actionType: "resource",
          handler: (req, res) => {
            isDarkMode = !isDarkMode;
            res.redirect("/admin");
          },
        },
      },
    ],
  },
});

const authenticateAdmin = async (email, password) => {
  const adminUser = await User.findOne({ email, role: "admin" });
  if (adminUser && bcrypt.compareSync(password, adminUser.password)) {
    return adminUser;
  }
  return null;
};

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
