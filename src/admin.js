import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import Product from "./models/Product.js";
import StockTransaction from "./models/StockTransaction.js";
import fileUpload from "express-fileupload";
import xlsx from "xlsx";
import express from "express";

AdminJS.registerAdapter(AdminJSMongoose);

const app = express();
app.use(fileUpload());

// AdminJS panel ayarları
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

                // Dosya kontrolü
                if (!file) {
                  return { message: "Lütfen bir dosya yükleyin!", status: "error" };
                }

                // Excel dosyasını okuyalım
                const workbook = xlsx.read(file.buffer, { type: "buffer" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(sheet);

                // Her satır için stok güncellemesi yapalım
                const updatedProducts = [];
                for (const row of data) {
                  const productId = row.productId;
                  const stock = row.stock;

                  // Geçerli bir ürün var mı kontrol et
                  const product = await Product.findById(productId);
                  if (product) {
                    // Stok güncelleme işlemi
                    product.stock = stock;
                    await product.save();

                    // Güncellenen ürünleri sakla
                    updatedProducts.push(product);
                  } else {
                    // Ürün bulunamazsa hata mesajı
                    return {
                      message: `Ürün bulunamadı: ${productId}`,
                      status: "error",
                    };
                  }
                }

                // Stok güncellemeleri başarılı
                return {
                  message: `${updatedProducts.length} ürün başarıyla güncellendi!`,
                  status: "success",
                };
              }

              // Dosya yükleme formu göstermek için
              return {
                message: "Dosyayı yükleyerek stokları güncelleyebilirsiniz.",
                status: "info",
              };
            },
          },
        },
      },
    },
    { resource: StockTransaction, options: { parent: { name: "Stok Hareketleri" } } },
  ],
  rootPath: "/admin",
});

// AdminJS router
const adminRouter = AdminJSExpress.buildRouter(admin);

export { admin, adminRouter };
