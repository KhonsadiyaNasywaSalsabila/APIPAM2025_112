// backend/routes/questRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import Middleware & Controller
const authenticateToken = require('../middleware/authMiddleware');
const questController = require('../controllers/questController');

// --- KONFIGURASI MULTER (Upload Gambar) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pastikan folder 'uploads' sudah dibuat di root project
    },
    filename: (req, file, cb) => {
        // Format nama file: TIMESTAMP-RANDOM-NAMASLI.ext
        // Contoh: 1705481234567-987654321-candi.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Konfigurasi Fields untuk menerima 2 jenis file
const uploadFields = upload.fields([
    { name: 'thumbnail', maxCount: 1 }, // Wajib (saat create)
    { name: 'stamp', maxCount: 1 }      // Opsional
]);

// --- ROUTES ---

// 1. GET ALL (Publik)
router.get('/', questController.getAllQuests);

// 2. GET DETAIL (Publik)
router.get('/:id', questController.getQuestById); 

// 3. CREATE (Admin Only)
router.post('/', authenticateToken, uploadFields, questController.createQuest);

// 4. UPDATE (Admin Only)
router.put('/:id', authenticateToken, uploadFields, questController.updateQuest);

// 5. DELETE (Admin Only)
router.delete('/:id', authenticateToken, questController.deleteQuest);

module.exports = router;