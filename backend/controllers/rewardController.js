const db = require('../config/db');

// ==========================================
// 1. PUBLIC / ADMIN (Yang sudah Anda punya)
// ==========================================

exports.getRewardsByQuest = async (req, res) => {
    try {
        const { questId } = req.params;
        const [rows] = await db.query('SELECT * FROM rewards WHERE quest_id = ?', [questId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createReward = async (req, res) => {
    try {
        const { quest_id, type, content_text, voucher_code } = req.body;
        let media_url = null;
        if (req.file) media_url = req.file.filename;

        if (!quest_id || !type) {
            return res.status(400).json({ message: "Quest ID dan Tipe Reward wajib diisi!" });
        }

        await db.query(
            `INSERT INTO rewards (quest_id, type, content_text, media_url, voucher_code) 
             VALUES (?, ?, ?, ?, ?)`,
            [quest_id, type, content_text || null, media_url, voucher_code || null]
        );

        res.status(201).json({ message: 'Reward Berhasil Ditambahkan!' });
    } catch (error) {
        console.error("Error Create Reward:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteReward = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM rewards WHERE reward_id = ?', [id]);
        res.json({ message: 'Reward dihapus' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// 2. USER INVENTORY (YANG HARUS DITAMBAHKAN)
// ==========================================

// Ambil semua reward milik user (berdasarkan quest yang sudah COMPLETED)
exports.getMyRewards = async (req, res) => {
    try {
        const userId = req.user.id; // Dari Token JWT

        // Logika: User dapat reward jika status paspor quest tersebut 'COMPLETED'
        // Kita JOIN rewards -> quests -> user_passport
        const sql = `
            SELECT 
                r.*, 
                q.title AS quest_title 
            FROM rewards r
            JOIN quests q ON r.quest_id = q.quest_id
            JOIN user_passport up ON up.quest_id = q.quest_id
            WHERE up.user_id = ? AND up.status = 'COMPLETED'
            ORDER BY up.completed_at DESC
        `;

        const [rows] = await db.query(sql, [userId]);
        res.json(rows); // Response kini mengandung field 'quest_title'
    } catch (error) {
        console.error("Error MyRewards:", error);
        res.status(500).json({ message: "Gagal memuat inventaris." });
    }
};