import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, role: "admin" });

    if (!user) {
      return res.status(400).json({ message: "Kullanıcı bulunamadı!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Hatalı şifre!" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true });

    res.json({ message: "Giriş başarılı!", redirect: "/admin" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Çıkış yapma (Logout) endpoint'i
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Çıkış başarılı!" });
});

export default router;
