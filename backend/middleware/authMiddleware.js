const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // 1. Ambil token dari Header (Format: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    
    // Split untuk memisahkan kata "Bearer" dan token aslinya
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Akses ditolak! Token tidak ditemukan." });
    }

    // 2. Verifikasi Token
    // PERBAIKAN: Hapus fallback "|| 'rahasia'". 
    // Kita wajib memaksa aplikasi menggunakan JWT_SECRET dari .env demi keamanan.
    const secret = process.env.JWT_SECRET;

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            // Jika token salah atau sudah expired
            return res.status(403).json({ message: "Token tidak valid atau kadaluwarsa." });
        }

        // 3. Simpan data user (ID & Role) ke dalam request
        // Ini penting agar di Controller kita bisa tahu siapa yang sedang login
        // Contoh akses nanti: req.user.role atau req.user.id
        req.user = user; 
        
        next(); // Lanjut ke Controller
    });
};

module.exports = authenticateToken;