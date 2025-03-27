import nodemailer from "nodemailer";

// E-posta gönderimi için yapılandırma
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "musdilkay1@gmail.com",
        pass: "zgvp unom bfon xvbb" 
    }
});

// Raporu yöneticilere e-posta ile gönderme (Named Export)
export const sendOrderReport = async (to, reportBuffer) => {
    try {
        const mailOptions = {
            from: "ilkaymustafa07@gmail.com",
            to,
            subject: "Günlük Sipariş Raporu",
            text: "Ekli dosyada sipariş raporunuz bulunmaktadır",
            attachments: [
                {
                    filename: "siparis_raporu.xlsx",
                    content: reportBuffer
                }
            ]
        };
        await transporter.sendMail(mailOptions);
        console.log("Rapor başarıyla gönderildi");
        return { success: true, message: "E-posta başarıyla gönderildi." };
    } catch (error) {
        console.error("E-posta gönderme hatası:", error);
        return { success: false, message: "E-posta gönderilemedi" };
    }
};