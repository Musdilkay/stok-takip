import nodemailer from "nodemailer";

//E-posta gönderimi için yapılandırma 

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mailiniz",
        pass: "şifreniz" 
    }
});

// raporu yöneticilere e-posta ile gönderme

export const sendOrderReport = async (to, reportBuffer) => {
    try {
        const mailOptions = {
            from : "mailiniz",
            to,
            subject: "Günlük Sipariş Raporu",
            text: "Ekli dosyada sipariş raporunuz bulunmamaktadır",
            attachments: [
                {
                    filename: "siparis_raporu.xlsx",
                    content: reportBuffer
                }
            ]
        };
        await transporter.sendMail(mailOptions);
        console.log("Rapor başarıyla gönderildi");
        return { success: true, message: "E-posta başarıyla gönderildi."};
    } catch (error) {
        console.error("E-posta göndermre hatası:", error);
        return { success: false, message: "E-posta gönderilemedi"};
    }
};