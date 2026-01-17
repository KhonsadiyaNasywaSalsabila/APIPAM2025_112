const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// 1. Ambil Profil User Sendiri
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id; 

        const sql = `
            SELECT user_id, full_name, email, role, level, total_xp, profile_image 
            FROM users 
            WHERE user_id = ?
        `;

        const [rows] = await db.query(sql, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Update Profil (Nama & Foto)
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Dari Token
        const { full_name } = req.body; // Dari Text Input

        // 1. Ambil data lama dulu (untuk mendapatkan nama file foto lama)
        const [oldData] = await db.query('SELECT profile_image FROM users WHERE user_id = ?', [userId]);
        
        if (oldData.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        let currentImage = oldData[0].profile_image;

        // 2. Cek apakah user mengupload file baru?
        if (req.file) {
            // Hapus file lama fisik jika ada (dan bukan null)
            if (currentImage) {
                const oldPath = path.join(__dirname, '../uploads', currentImage);
                // Cek apakah file ada sebelum dihapus agar tidak error
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            // Ganti variable currentImage dengan nama file baru
            currentImage = req.file.filename;
        }

        // 3. Update Database
        await db.query(
            'UPDATE users SET full_name = ?, profile_image = ? WHERE user_id = ?',
            [full_name, currentImage, userId]
        );

        // 4. Ambil data terbaru user untuk dikirim balik ke Android
        // Ini penting agar UI Android langsung berubah tanpa perlu restart app
        const [updatedUser] = await db.query(
            'SELECT user_id, email, full_name, profile_image, total_xp, level, role FROM users WHERE user_id = ?', 
            [userId]
        );
        
        // Kirim response sukses beserta data user terbaru
        res.json(updatedUser[0]);

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: 'Gagal update profil' });
    }
};