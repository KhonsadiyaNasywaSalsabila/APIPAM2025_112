const express = require('express');
const router = express.Router();

// Import Middleware
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 👇 PERBAIKAN 1: Import 'getMyRewards' dari controller
const { 
    getRewardsByQuest, 
    createReward, 
    deleteReward,
    getMyRewards 
} = require('../controllers/rewardController');

// --- ROUTES ---

// 👇 PERBAIKAN 2: Route ini WAJIB ditaruh PALING ATAS (Sebelum /:questId)
// Endpoint: GET /api/rewards/my-rewards
router.get('/my-rewards', authenticateToken, getMyRewards);

// ---------------------------------------------------------

// 1. GET (Lihat Reward per Quest - Untuk Admin/Detail)
// Endpoint: GET /api/rewards/{id}
router.get('/:questId', authenticateToken, getRewardsByQuest);

// 2. POST (Tambah Reward)
router.post('/', authenticateToken, upload.single('media_file'), createReward);

// 3. DELETE (Hapus Reward)
router.delete('/:id', authenticateToken, deleteReward);

module.exports = router;