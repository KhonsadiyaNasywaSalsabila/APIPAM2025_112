// backend/controllers/gameplayController.js
const db = require('../config/db');

// ==========================================
// BAGIAN 1: PUBLIC DATA (Tidak butuh Login)
// ==========================================

// 1. Ambil Stages DAN Hints-nya sekaligus
exports.getQuestStages = async (req, res) => {
    try {
        const { id } = req.params; // quest_id

        // A. Ambil daftar Stage
        const [stages] = await db.query(
            'SELECT * FROM quest_stages WHERE quest_id = ? ORDER BY stage_seq ASC', 
            [id]
        );

        // B. Ambil Hints secara paralel
        const stagesWithHints = await Promise.all(stages.map(async (stage) => {
            const [hints] = await db.query(
                'SELECT * FROM stage_hints WHERE stage_id = ? ORDER BY hint_cost ASC', 
                [stage.stage_id]
            );
            return {
                ...stage,
                hints: hints 
            };
        }));

        res.json(stagesWithHints);
    } catch (err) {
        console.error("Error getQuestStages:", err);
        res.status(500).json({ message: err.message });
    }
};

// 2. Ambil Hints berdasarkan Stage ID
exports.getStageHints = async (req, res) => {
    try {
        const { id } = req.params; // stage_id
        const [hints] = await db.query(
            'SELECT * FROM stage_hints WHERE stage_id = ? ORDER BY hint_cost ASC', 
            [id]
        );
        res.json(hints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. Ambil Rewards jika misi selesai
exports.getQuestRewards = async (req, res) => {
    try {
        const { id } = req.params; // quest_id
        const [rewards] = await db.query(
            'SELECT * FROM rewards WHERE quest_id = ?', 
            [id]
        );
        res.json(rewards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ==========================================
// BAGIAN 2: PRIVATE DATA (Butuh Token Login)
// ==========================================

// 4. Ambil Daftar Passport (Riwayat Main)
exports.getUserPassports = async (req, res) => {
    try {
        const user_id = req.user.id; 
        
        const sql = `
            SELECT p.*, q.title, q.thumbnail_url, q.total_dist 
            FROM user_passport p
            JOIN quests q ON p.quest_id = q.quest_id
            WHERE p.user_id = ?
            ORDER BY p.started_at DESC
        `;
        const [rows] = await db.query(sql, [user_id]);
        res.json(rows);
    } catch (err) {
        console.error("Passport Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// 5. Mulai Quest Baru (Start Game)
exports.startQuest = async (req, res) => {
    try {
        const user_id = req.user.id; 
        const { quest_id } = req.body;

        // Cek duplikasi
        const [existing] = await db.query(
            'SELECT * FROM user_passport WHERE user_id = ? AND quest_id = ?',
            [user_id, quest_id]
        );

        if (existing.length > 0) {
            return res.json(existing[0]); 
        }

        // Buat baru (last_stage default 0)
        const [result] = await db.query(
            'INSERT INTO user_passport (user_id, quest_id, status, last_stage) VALUES (?, ?, "IN_PROGRESS", 0)',
            [user_id, quest_id]
        );

        const [newPassport] = await db.query(
            'SELECT * FROM user_passport WHERE passport_id = ?', 
            [result.insertId]
        );

        res.json(newPassport[0]);

    } catch (err) {
        console.error("StartQuest Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// 6. Cek Status Quest User (Untuk Resume Game)
exports.getQuestStatus = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { quest_id } = req.params;

        const [rows] = await db.query(
            'SELECT * FROM user_passport WHERE user_id = ? AND quest_id = ?',
            [user_id, quest_id]
        );

        if (rows.length === 0) {
            // Belum pernah main, kembalikan status NEW
            return res.json({ status: 'NEW', last_stage: 0 });
        }

        // Mengembalikan { status: 'IN_PROGRESS', last_stage: 5, ... }
        res.json(rows[0]); 
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 7. [BARU] Simpan Progress Stage (Save State)
// Dipanggil setiap kali user menyelesaikan satu stage
exports.updateStageProgress = async (req, res) => {
    try {
        const user_id = req.user.id;
        // Kita terima 'last_stage' dari body request (index stage yang baru saja diselesaikan)
        const { quest_id, last_stage } = req.body;

        // Validasi input sederhana
        if (last_stage === undefined || !quest_id) {
            return res.status(400).json({ message: "Missing quest_id or last_stage" });
        }

        // Update database: set last_stage ke angka baru
        await db.query(
            'UPDATE user_passport SET last_stage = ? WHERE user_id = ? AND quest_id = ?',
            [last_stage, user_id, quest_id]
        );

        res.json({ message: 'Progress saved successfully', last_stage: last_stage });

    } catch (error) {
        console.error("Update Progress Error:", error);
        res.status(500).json({ message: 'Failed to save progress' });
    }
};

// 8. Selesaikan Quest (Triggered by Last Stage)
exports.completeQuest = async (req, res) => {
    const { questId } = req.params;
    const userId = req.user.id;

    try {
        // A. Cek apakah paspor ada
        const [passport] = await db.execute(
            "SELECT * FROM user_passport WHERE user_id = ? AND quest_id = ?",
            [userId, questId]
        );

        if (passport.length === 0) {
            return res.status(404).json({ message: "Passport not found. Start quest first." });
        }

        // Jika sudah selesai sebelumnya, jangan tambah XP lagi (biar tidak curang)
        if (passport[0].status === 'COMPLETED') {
            return res.json({ message: "Quest already completed", xp_earned: 0 });
        }

        // B. Update Status Paspor jadi COMPLETED
        await db.execute(
            "UPDATE user_passport SET status = 'COMPLETED', completed_at = NOW() WHERE user_id = ? AND quest_id = ?",
            [userId, questId]
        );

        // C. Ambil info Reward XP dari tabel Quest
        const [questData] = await db.execute("SELECT reward_xp FROM quests WHERE quest_id = ?", [questId]);
        const xpReward = questData[0]?.reward_xp || 100; // Default 100 jika null

        // D. Tambahkan XP ke User
        await db.execute(
            "UPDATE users SET total_xp = total_xp + ? WHERE user_id = ?",
            [xpReward, userId]
        );

        res.json({ message: "Quest Completed", xp_earned: xpReward });

    } catch (error) {
        console.error("Complete Quest Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.useHint = async (req, res) => {
    const connection = await db.getConnection(); // Mulai transaksi
    try {
        await connection.beginTransaction();
        const userId = req.user.id;
        const { hint_id } = req.body;

        // 1. Ambil data harga hint
        const [hint] = await connection.query('SELECT hint_cost, hint_text FROM stage_hints WHERE hint_id = ?', [hint_id]);
        if (hint.length === 0) return res.status(404).json({ message: "Hint tidak ditemukan" });

        const cost = hint[0].hint_cost;

        // 2. Cek saldo XP user
        const [user] = await connection.query('SELECT total_xp FROM users WHERE user_id = ?', [userId]);
        if (user[0].total_xp < cost) {
            return res.status(400).json({ message: "XP tidak mencukupi!" });
        }

        // 3. Potong XP User
        await connection.query('UPDATE users SET total_xp = total_xp - ? WHERE user_id = ?', [cost, userId]);

        await connection.commit();
        res.json({ 
            message: "Hint berhasil dibeli", 
            hint_text: hint[0].hint_text,
            new_xp: user[0].total_xp - cost 
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
};