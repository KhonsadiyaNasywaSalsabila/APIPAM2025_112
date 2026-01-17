const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper: Hapus file fisik dari folder uploads
const deleteFile = (filename) => {
    if (!filename) return;
    const filePath = path.join(__dirname, '../uploads', filename);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (!err) {
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Gagal menghapus file ${filename}:`, err);
            });
        }
    });
};

// 1. Ambil Semua Data Quest
exports.getAllQuests = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM quests ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error("Error getAllQuests:", error);
        res.status(500).json({ message: "Gagal mengambil data quest" });
    }
};

// 2. Tambah Quest Baru
exports.createQuest = async (req, res) => {
    try {
        // Ambil data text dari body
        const { 
            title, description, highlights, category, difficulty, 
            start_location, finish_location, // Sesuaikan nama field dengan Frontend (start_location vs start_location_name)
            est_duration, total_dist, latitude, longitude, reward_xp 
        } = req.body;

        // Note: Field name dari frontend mungkin 'start_location', tapi di DB 'start_location_name'.
        // Pastikan mapping di bawah sesuai kolom DB Anda.
        
        // Ambil File dari Multer
        // req.files adalah object: { thumbnail: [file], stamp: [file] }
        const thumbnailFile = (req.files && req.files['thumbnail']) ? req.files['thumbnail'][0].filename : null;
        const stampFile = (req.files && req.files['stamp']) ? req.files['stamp'][0].filename : null;

        // Validasi Thumbnail Wajib
        if (!thumbnailFile) {
            return res.status(400).json({ message: "Thumbnail wajib diupload!" });
        }

        const sql = `
            INSERT INTO quests 
            (title, description, highlights, category, difficulty, 
             thumbnail_url, stamp_url, 
             start_location_name, finish_location_name, 
             est_duration, total_dist, latitude, longitude, reward_xp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            title, description, highlights, category, difficulty,
            thumbnailFile, stampFile, // Simpan nama file
            start_location, finish_location, // Frontend kirim 'start_location', simpan ke 'start_location_name'
            est_duration, total_dist, latitude, longitude, 
            reward_xp || 100
        ];

        const [result] = await db.query(sql, values);

        res.status(201).json({
            message: 'Quest Berhasil Dibuat!',
            data: { quest_id: result.insertId, title }
        });

    } catch (error) {
        console.error("Error createQuest:", error);
        res.status(500).json({ message: "Gagal membuat quest", error: error.message });
    }
};

// 3. Ambil Detail 1 Quest
exports.getQuestById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM quests WHERE quest_id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Quest tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Update Quest
exports.updateQuest = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            title, description, highlights, category, difficulty,
            start_location, finish_location, 
            est_duration, total_dist, latitude, longitude, reward_xp 
        } = req.body;

        // 1. Ambil data lama untuk cek file lama
        const [oldData] = await db.query('SELECT thumbnail_url, stamp_url FROM quests WHERE quest_id = ?', [id]);
        if (oldData.length === 0) return res.status(404).json({ message: 'Quest tidak ditemukan' });

        let currentThumbnail = oldData[0].thumbnail_url;
        let currentStamp = oldData[0].stamp_url;

        // 2. Cek apakah ada file baru diupload
        if (req.files) {
            // Jika ada thumbnail baru
            if (req.files['thumbnail']) {
                deleteFile(currentThumbnail); // Hapus file lama fisik
                currentThumbnail = req.files['thumbnail'][0].filename; // Update nama file
            }
            // Jika ada stamp baru
            if (req.files['stamp']) {
                deleteFile(currentStamp); // Hapus file lama fisik
                currentStamp = req.files['stamp'][0].filename; // Update nama file
            }
        }

        // 3. Update Database
        const sql = `
            UPDATE quests SET 
            title=?, description=?, highlights=?, category=?, difficulty=?, 
            start_location_name=?, finish_location_name=?, 
            est_duration=?, total_dist=?, latitude=?, longitude=?, reward_xp=?,
            thumbnail_url=?, stamp_url=?
            WHERE quest_id=?
        `;
        
        const values = [
            title, description, highlights, category, difficulty,
            start_location, finish_location,
            est_duration, total_dist, latitude, longitude, reward_xp,
            currentThumbnail, currentStamp, // Update dengan file baru/lama
            id
        ];

        await db.query(sql, values);
        res.json({ message: 'Quest berhasil diupdate!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// 5. Hapus Quest
exports.deleteQuest = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ambil info file sebelum hapus record DB
        const [rows] = await db.query('SELECT thumbnail_url, stamp_url FROM quests WHERE quest_id = ?', [id]);
        
        if (rows.length > 0) {
            // 2. Hapus file fisik
            deleteFile(rows[0].thumbnail_url);
            deleteFile(rows[0].stamp_url);
        }

        // 3. Hapus Record DB
        await db.query('DELETE FROM quests WHERE quest_id = ?', [id]);
        res.json({ message: 'Quest berhasil dihapus!' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};