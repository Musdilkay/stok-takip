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
app.use(express.static("src/public")); // ✅ Statik dosya desteği eklendi (logo için)

// ✅ Tema (başlangıçta dark mode kapalı)
let isDarkMode = true; // Başlangıçta dark mode açık olsun

// ✅ Tema fonksiyonu
const getTheme = () => {
  return {
    colors: {
      primary100: isDarkMode ? "#1e1e1e" : "#ffffff",  // Arka plan rengi
      primary80: isDarkMode ? "#282828" : "#f0f0f0",
      primary60: isDarkMode ? "#3a3a3a" : "#d0d0d0",
      primary40: isDarkMode ? "#4b4b4b" : "#b0b0b0",
      primary20: isDarkMode ? "#5c5c5c" : "#909090",
      grey100: isDarkMode ? "#ffffff" : "#121212", // Yazılar beyaz
      grey80: isDarkMode ? "#d1d1d1" : "#000000",
      grey60: isDarkMode ? "#b0b0b0" : "#333333",
      grey40: isDarkMode ? "#8c8c8c" : "#444444",
      grey20: isDarkMode ? "#6b6b6b" : "#555555",
      grey0: isDarkMode ? "#3a3a3a" : "#666666",
      white: "#121212",  // Arka plan tamamen koyu
      accent: "#ff9800", // Vurgulu renk
      hoverBg: isDarkMode ? "#333333" : "#e0e0e0", // Üzerine gelince değişen arka plan
      inputBg: isDarkMode ? "#222222" : "#f5f5f5", // Input arka planını koyulaştır
      inputBorder: isDarkMode ? "#444444" : "#cccccc", // Input kenar rengini koyu yap
      inputColor: isDarkMode ? "#ffffff" : "#000000", // Input içindeki yazıları beyaz yap
      buttonBg: isDarkMode ? "#444444" : "#e0e0e0", // Butonların arka planını koyu yap
      buttonColor: "#ffffff", // Buton yazıları beyaz
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
  branding: {
    companyName: "Stok Takip Sistemi",
    logo: "/e-takip.png", // ✅ Logo eklendi (public içindeki logo)
    theme: getTheme(), // ✅ Tema burada kullanıldı
    features: [
      {
        name: "darkModeToggle",
        label: "Dark Mode",
        action: {
          name: "toggleDarkMode",
          actionType: "resource",
          handler: (req, res) => {
            // Tema değişikliğini burada yap
            isDarkMode = !isDarkMode; // Dark mode geçişini kontrol et
            res.redirect("/admin"); // Yeniden yükle
          },
        },
      },
    ],
  },
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
