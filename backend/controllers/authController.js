// controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 🔒 AMBIL SECRET DARI .ENV
const JWT_SECRET = process.env.JWT_SECRET;

// 🛡️ VALIDASI: Server tidak boleh jalan jika kunci rahasia belum diset!
if (!JWT_SECRET) {
    console.error("❌ FATAL ERROR: JWT_SECRET tidak ditemukan di file .env");
    process.exit(1); // Matikan server agar developer sadar
}

// 1. REGISTER
exports.register = async (req, res) => {
    // Validasi Input Dasar
    const { full_name, email, password } = req.body;
    
    if (!full_name || !email || !password) {
        return res.status(400).json({ 
            status: 'error',
            message: 'Nama, Email, dan Password wajib diisi!' 
        });
    }

    try {
        // A. Cek Email Duplikat
        const [existingUser] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        
        if (existingUser.length > 0) {
            return res.status(409).json({ 
                status: 'error',
                message: 'Email sudah terdaftar! Silakan login.' 
            });
        }

        // B. Logika Role & Level
        const userRole = email.endsWith('@nusa.com') ? 'ADMIN' : 'USER';
        
        // Default Values
        const initialLevel = 1;
        const initialXp = 0;

        // C. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // D. Simpan ke Database
        const query = `
            INSERT INTO users (full_name, email, password, role, level, total_xp) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [full_name, email, hashedPassword, userRole, initialLevel, initialXp]);

        res.status(201).json({ 
            status: 'success',
            message: 'Registrasi Berhasil! Silakan Login.',
            data: { role: userRole } 
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server saat registrasi' });
    }
};

// 2. LOGIN
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email dan Password wajib diisi!' });
    }

    try {
        // A. Cari User di Database
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: "Email tidak ditemukan!" });
        }

        const user = rows[0];

        // B. Cek Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah!" });
        }

        // C. Generate Token JWT
        // ✅ Sekarang aman, karena JWT_SECRET sudah divalidasi di atas
        const token = jwt.sign(
            { id: user.user_id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '7d' } 
        );

        // D. Kirim Response
        res.json({
            status: 'success',
            message: "Login berhasil",
            data: { 
                token: token,
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,        
                level: user.level,
                total_xp: user.total_xp,
                profile_image: user.profile_image
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat login" });
    }
};