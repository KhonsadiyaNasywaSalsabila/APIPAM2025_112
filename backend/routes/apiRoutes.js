const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import Multer langsung agar config lebih jelas
const path = require('path');
const authenticateToken = require('../middleware/authMiddleware');

// Import Controllers
const gameplayController = require('../controllers/gameplayController');
const questController = require('../controllers/questController');
const userController = require('../controllers/userController');
const stageController = require('../controllers/stageController');

// --- KONFIGURASI UPLOAD GAMBAR (MULTER) ---
// Kita konfigurasi di sini agar nama file unik (timestamp)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pastikan folder 'uploads' ada di root
    },
    filename: (req, file, cb) => {
        // Format: timestamp-random-namasli.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// ==========================================
// PUBLIC ROUTES (Tanpa Token)
// ==========================================
router.get('/quests', questController.getAllQuests);
router.get('/quests/:id/stages', gameplayController.getQuestStages);
router.get('/quests/:id/rewards', gameplayController.getQuestRewards);
router.get('/stages/:id/hints', gameplayController.getStageHints);

// ==========================================
// PROTECTED ROUTES (Wajib Token Login)
// ==========================================

// 1. USER PROFILE
router.get('/users/profile', authenticateToken, userController.getMyProfile);

// 👇 ROUTE BARU: Update Profil (Nama & Foto)
// Menggunakan 'upload.single' karena user hanya upload 1 foto profil
router.put('/users/profile', authenticateToken, upload.single('profile_image'), userController.updateProfile);


// 2. GAMEPLAY & PASSPORT
router.get('/passports', authenticateToken, gameplayController.getUserPassports);
router.post('/passports', authenticateToken, gameplayController.startQuest);
router.get('/gameplay/status/:quest_id', authenticateToken, gameplayController.getQuestStatus);
router.post('/gameplay/use-hint', authenticateToken, gameplayController.useHint);

// 👇 ROUTE BARU: Simpan progress stage terakhir
router.post('/gameplay/progress', authenticateToken, gameplayController.updateStageProgress);

// 3. COMPLETE QUEST (Trigger Stempel & XP)
router.post('/quests/:questId/complete', authenticateToken, gameplayController.completeQuest);


// ==========================================
// ADMIN ROUTES (Diakses via Android)
// ==========================================
// Route Create Stage (support multipart untuk create stage via HP)
router.post(
    '/quests/:id/stages', 
    authenticateToken, 
    upload.none(), // Gunakan upload.none() jika stage tidak ada upload file gambar
    stageController.createStage 
);

module.exports = router;