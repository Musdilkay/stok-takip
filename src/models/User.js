import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" }, // Kullanıcı rolleri
  },
  { timestamps: true } // Kullanıcı oluşturulma ve güncellenme zamanlarını kaydet
);

// Kullanıcı kaydedilmeden önce şifreyi hash'leyelim
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre doğrulama fonksiyonu
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Şifre doğrulama hatası:", error);
    return false;
  }
};

const User = mongoose.model("User", userSchema);
export default User;
