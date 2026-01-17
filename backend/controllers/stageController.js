// backend/controllers/stageController.js
const db = require('../config/db');

// ==========================================
// 1. GET STAGES (Beserta Hints)
// ==========================================
exports.getStagesByQuest = async (req, res) => {
    try {
        // Mengambil ID dari params URL (sesuai route /:questId)
        const { questId } = req.params;
        
        // 1. Ambil data stage urut berdasarkan sequence
        const [stages] = await db.query(
            'SELECT * FROM quest_stages WHERE quest_id = ? ORDER BY stage_seq ASC', 
            [questId]
        );

        // 2. Ambil hints untuk setiap stage (Looping)
        for (let stage of stages) {
            const [hints] = await db.query(
                'SELECT * FROM stage_hints WHERE stage_id = ?', 
                [stage.stage_id]
            );
            stage.hints = hints; 
        }

        res.json(stages);
    } catch (error) {
        console.error("Error getStages:", error);
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// 2. CREATE STAGE (Dengan Transaksi)
// ==========================================
exports.createStage = async (req, res) => {
    // Siapkan koneksi untuk transaksi
    const connection = await db.getConnection();
    
    try {
        // Mulai Transaksi
        await connection.beginTransaction();

        // 1. Ambil Data dari Body & Params
        // Prioritas ambil ID dari params, jika tidak ada ambil dari body
        const questId = req.params.id || req.body.quest_id;
        
        const { 
            sequence,       // stage_seq
            location_name,  // [PENTING] Judul Lokasi
            riddle_text, 
            lat, 
            lon, 
            radius,
            correct_answer, 
            hints 
        } = req.body;

        // 2. Validasi Data Wajib
        if (!questId || !riddle_text || !lat || !lon || !location_name) {
            throw new Error("Data stage tidak lengkap. Wajib isi: Riddle, Latitude, Longitude, dan Nama Lokasi.");
        }

        // 3. Query INSERT STAGE
        // [FIX] Urutan disesuaikan dengan fisik database:
        // quest_id -> stage_seq -> location_name -> riddle_text -> ...
        const sqlStage = `
            INSERT INTO quest_stages 
            (quest_id, stage_seq, location_name, riddle_text, latitude, longitude, correct_answer, radius, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        // [FIX] Array values WAJIB urut sesuai kolom di atas
        const valuesStage = [
            questId, 
            sequence || 1, 
            location_name,      // <--- Posisi sesuai request (setelah sequence)
            riddle_text, 
            lat, 
            lon, 
            correct_answer || null, 
            radius || 50
        ];

        // Jalankan Query Insert Stage
        const [resultStage] = await connection.query(sqlStage, valuesStage);
        const newStageId = resultStage.insertId;

        // 4. Proses INSERT HINTS (Jika ada)
        let hintsArray = hints;

        // Parsing JSON jika dikirim sebagai string (dari FormData)
        if (typeof hints === 'string') {
            try {
                hintsArray = JSON.parse(hints);
            } catch (e) {
                hintsArray = [];
            }
        }

        // Pastikan array valid dan ada isinya
        if (Array.isArray(hintsArray) && hintsArray.length > 0) {
            // Filter hint yang teksnya kosong
            const validHints = hintsArray.filter(h => h.text && h.text.trim() !== "");
            
            if (validHints.length > 0) {
                // Bulk Insert untuk performa lebih baik
                const sqlHint = `INSERT INTO stage_hints (stage_id, hint_text, hint_cost) VALUES ?`;
                
                // Map data menjadi array of array [[id, text, cost], ...]
                const hintValues = validHints.map(h => [newStageId, h.text, h.cost || 10]);

                await connection.query(sqlHint, [hintValues]);
            }
        }

        // 5. Commit Transaksi (Simpan Permanen)
        await connection.commit();

        res.status(201).json({ 
            message: 'Stage dan Hints berhasil disimpan!',
            stageId: newStageId
        });

    } catch (error) {
        // Jika ada error, batalkan semua perubahan (Rollback)
        await connection.rollback();
        console.error("Error createStage:", error);
        res.status(500).json({ message: error.message });
    } finally {
        // [PENTING] Selalu lepaskan koneksi di akhir, sukses maupun gagal
        connection.release();
    }
};

// ==========================================
// 3. DELETE STAGE
// ==========================================
exports.deleteStage = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Hapus stage (Hints otomatis terhapus jika setting database ON DELETE CASCADE)
        await db.query('DELETE FROM quest_stages WHERE stage_id = ?', [id]);
        
        res.json({ message: 'Stage berhasil dihapus' });
    } catch (error) {
        console.error("Error deleteStage:", error);
        res.status(500).json({ message: error.message });
    }
};

// Ambil detail 1 stage (termasuk hints)
exports.getStageById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data stage
        const [stage] = await db.query('SELECT * FROM quest_stages WHERE stage_id = ?', [id]);
        
        if (stage.length === 0) return res.status(404).json({ message: "Stage not found" });

        // Ambil data hints
        const [hints] = await db.query('SELECT * FROM stage_hints WHERE stage_id = ? ORDER BY hint_cost ASC', [id]);

        res.json({ ...stage[0], hints });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ==========================================
// 5. UPDATE STAGE (Termasuk Hints)
// ==========================================
exports.updateStage = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction(); // Pakai transaksi biar aman

        const { id } = req.params; // stage_id
        const { 
            riddle_text, lat, lon, location_name, 
            radius, correct_answer, sequence, hints 
        } = req.body;

        // 1. Update Data Inti Stage
        await connection.query(
            `UPDATE quest_stages SET 
             riddle_text=?, latitude=?, longitude=?, location_name=?, radius=?, correct_answer=?, stage_seq=?
             WHERE stage_id=?`,
            [riddle_text, lat, lon, location_name, radius, correct_answer, sequence, id]
        );

        // 2. Update Hints (Strategi: Hapus Lama -> Insert Baru)
        // Ini cara paling aman & mudah untuk menangani edit array
        
        // Hapus semua hint lama milik stage ini
        await connection.query('DELETE FROM stage_hints WHERE stage_id = ?', [id]);

        // Insert hint baru (jika ada)
        let hintsArray = hints;
        // Handle jika hints dikirim sebagai string JSON (kadang terjadi di multipart)
        if (typeof hints === 'string') {
            try { hintsArray = JSON.parse(hints); } catch(e) { hintsArray = []; }
        }

        if (Array.isArray(hintsArray) && hintsArray.length > 0) {
            const validHints = hintsArray.filter(h => h.text && h.text.trim() !== "");
            if (validHints.length > 0) {
                const hintValues = validHints.map(h => [id, h.text, h.cost || 10]);
                await connection.query(
                    'INSERT INTO stage_hints (stage_id, hint_text, hint_cost) VALUES ?', 
                    [hintValues]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Stage updated successfully" });

    } catch (err) {
        await connection.rollback();
        console.error("Update Error:", err);
        res.status(500).json({ message: err.message });
    } finally {
        connection.release();
    }
};