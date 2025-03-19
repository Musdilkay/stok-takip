import jwt from "jsonwebtoken";

// Kullanıcı Kimlik Doğrulama Middleware'i
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim! Lütfen giriş yapın." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Kullanıcı bilgilerini isteğe ekle
    next();
  } catch (error) {
    console.error("🚨 Token doğrulama hatası:", error.message);
    res.status(401).json({ message: "Geçersiz veya süresi dolmuş token!" });
  }
};

// **Admin Kontrolü Middleware'i (Express İçin)**
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz işlem! Admin yetkisi gerekiyor." });
  }
  next();
};

// **AdminJS için özel middleware (Admin Paneli Yetkilendirme)**
export const adminOnlyMiddleware = async (request, context) => {
  if (!context || !context.currentAdmin) {
    throw new Error("Yetkisiz işlem! Admin yetkisi gerekiyor.");
  }

  if (context.currentAdmin.role !== "admin") {
    throw new Error("Bu işlemi gerçekleştirmek için admin yetkisine sahip olmalısınız.");
  }

  return request; // AdminJS middleware formatına uygun hale getirildi.
};

export default authMiddleware;
