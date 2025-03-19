import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Yetkisiz erişim! Lütfen giriş yapın." });
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

// Yetki kontrolü için middleware (Sadece adminler erişebilir)
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Yetkisiz işlem! Admin yetkisi gerekiyor." });
  }
  next();
};

export default authMiddleware;
