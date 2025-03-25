import xlsx from "xlsx";
import Order from "../models/Order.js";

//sipariş verilerini excel raporu olarak oluşturma fonksiyonu 

export const generateOrderReport = async () => {
    try {
        const orders = await Order.find().lean();

        if(!orders.length) {
            throw new Error("Hiç Sipariş bulunamadı");
        }
        //Excel için veri formatı 
        const data = orders.map(order => ({
            "Sipariş ID": order._id,
            "Müşteri Adı": order.customerName,
            "Telefon": order.customerPhone,
            "Toplam Tutar": order.totalPrice,
            "Durum": order.status,
            "Tarih": order.createdAt.toISOString()
        }));

        const ws = xlsx.utils.json_to_sheet(data);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Siparişler");

        return xlsx.write(wb,{ type: "buffer"});
    } catch (error) {
        console.error("Rapor oluşturma hatası:", error);
        throw error;
    }
};