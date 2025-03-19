import express from 'express';
import User from '../models/User.js';  // Kullanıcı modelini içe aktar
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "Bu e-posta adresi zaten kullanılıyor!" });
    }

    const user = new User({
      username,
      email,
      password,
      role,
    });

    await user.save();
    res.status(201).json({ message: "Kullanıcı başarıyla kaydedildi!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kullanıcı kaydedilemedi." });
  }
});

// Kullanıcı girişi (JWT ile token oluşturma)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Geçersiz şifre!" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Bir hata oluştu!" });
  }
});

export default router;
