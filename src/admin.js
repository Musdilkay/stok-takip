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
import StockLog from "./models/StockLog.js";
import Notification from "./models/Notification.js";
import User from "./models/User.js";
import Order from "./models/Order.js";
import Customer from "./models/customer.js";
import { adminOnlyMiddleware } from "./middlewares/authMiddleware.js";
import { sendOrderReport } from "./utils/emailService.js";
import { generateOrderReport } from "./utils/orderReport.js";

AdminJS.registerAdapter(AdminJSMongoose);

const app = express();
app.use(fileUpload());
app.use(express.static("src/public"));  // 📌 Statik klasör tanımlandı

let isDarkMode = true;

const getTheme = () => {
  return {
    colors: {
      primary100: isDarkMode ? "#1e1e1e" : "#ffffff",
      primary80: isDarkMode ? "#303030" : "#f5f5f5",
      primary60: isDarkMode ? "#4a4a4a" : "#dcdcdc",
      primary40: isDarkMode ? "#626262" : "#b0b0b0",
      primary20: isDarkMode ? "#7a7a7a" : "#909090",

      grey100: isDarkMode ? "#444444" : "#333333",
      grey80: isDarkMode ? "#666666" : "#4d4d4d",
      grey60: isDarkMode ? "#888888" : "#666666",
      grey40: isDarkMode ? "#aaaaaa" : "#999999",
      grey20: isDarkMode ? "#cccccc" : "#bbbbbb",
      grey0: isDarkMode ? "#eeeeee" : "#dddddd",

      white: isDarkMode ? "#181818" : "#ffffff",
      accent: "#ff9800",
      hoverBg: isDarkMode ? "#555555" : "#dcdcdc",
      inputBg: isDarkMode ? "#252525" : "#f8f8f8",
      inputBorder: isDarkMode ? "#666666" : "#cccccc",
      inputColor: isDarkMode ? "#ffffff" : "#000000",

      buttonBg: isDarkMode ? "#ff4500" : "#0044cc",
      buttonColor: isDarkMode ? "#ffffff" : "#ffffff",
      buttonHoverBg: isDarkMode ? "#ff2200" : "#0033aa",
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
                  const newStock = row.stock;
                  const product = await Product.findById(productId);

                  if (product) {
                    const oldStock = product.stock;

                    product.stock = newStock;
                    await product.save();
                    updatedProducts.push(product);

                    await StockLog.create({
                      product: product._id,
                      changedBy: context.currentAdmin._id,
                      oldStock,
                      newStock,
                      changeAmount: newStock - oldStock,
                      actionType: "manual",
                    });

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
        showProperties: ["message", "type", "createdAt"],
        actions: {
          new: { isAccessible: false },
          edit: { isAccessible: false },
          delete: { isAccessible: true },
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
    {
      resource: Order,
      options: {
        parent: { name: "Sipariş Yönetimi" },
        listProperties: ["customerName", "customerPhone", "totalPrice", "status", "createdAt"],
        actions: {
          edit: { isAccessible: true },
          delete: { isAccessible: false },
          new: { isAccessible: true },
          sendReport: {
            actionType: "resource",
            label: "Sipariş Raporunu E-Posta Gönder",
            icon: "Send",
            component: false,
            handler: async (request, response, context) => {
              try {
                const reportBuffer = await generateOrderReport();
                await sendOrderReport("yonetici@mail.com", reportBuffer);
                return {
                  message: "Sipariş raporu başarıyla e-posta ile gönderildi!",
                  status: "success"
                };
              } catch (error) {
                return {
                  message: "Rapor gönderilirken hata oluştu!",
                  status: "error"
                };
              }
            }
          }
        }
      }
    },
    {
      resource: Customer,
      options: {
        parent: { name: "Müşteri Yönetimi" },
        listProperties: ["name", "email", "phoneNumber", "address"],
        editProperties: ["name", "email", "phoneNumber", "address"],
        showProperties: ["name", "email", "phoneNumber", "address"],
        actions: {
          edit: { isAccessible: true },
          delete: { isAccessible: false },
          new: { isAccessible: true },
        },
      },
    },
  ],
  rootPath: "/admin",
  branding: {
    companyName: "Stok Takip Sistemi",
    logo: "/e-takip.png",
    theme: getTheme(),
    assets: {
      styles: ["/admin-style.css"],
    },
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
  },

  
{
  resource: StockLog,
  options: {
    parent: { name: "Stok Hareketleri" },
    listProperties: ["product", "changedBy", "oldStock", "newStock", "changeAmount", "actionType", "createdAt"],
    showProperties: ["product", "changedBy", "oldStock", "newStock", "changeAmount", "actionType", "createdAt"],
    actions: {
      new: { isAccessible: false }, // Manuel eklenemez
      edit: { isAccessible: false }, // Düzenlenemez
      delete: { isAccessible: false }, // Silinemez
    },
  },
}
);

export { admin, adminRouter };