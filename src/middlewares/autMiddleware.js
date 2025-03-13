import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({message: "Token bulunamadı! Lütfen giriş yapın."});
    }

    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded; // Token'dan elde edilen kullanıcı bilgilerini req.user'a ekle
        next();
    } catch (error) {
        res.status(401).json({ message: "Geçersiz veya süresi dolmuş token!"});
    }
};

export default authMiddleware;