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

                // Excel dosyasını işle
                const workbook = xlsx.read(file.buffer, { type: "buffer" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = xlsx.utils.sheet_to_json(sheet);

                for (const row of data) {
                  const productId = row.productId;
                  const stock = row.stock;
                  await Product.updateOne({ _id: productId }, { $set: { stock: stock } });
                }

                return { message: "Stoklar başarıyla güncellendi!", status: "success" };
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
    { resource: StockTransaction, options: { parent: { name: "Stok Hareketleri" } } },
  ],
  rootPath: "/admin",
});

const adminRouter = AdminJSExpress.buildRouter(admin);
export { admin, adminRouter };