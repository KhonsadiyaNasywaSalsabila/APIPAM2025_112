// backend/routes/stageRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const stageController = require('../controllers/stageController');
const upload = require('../middleware/uploadMiddleware'); 

// URL Dasar: /api/admin/stages

// 1. GET Stages by Quest (Untuk QuestDetail) -> /api/admin/stages/1
router.get('/:questId', authenticateToken, stageController.getStagesByQuest);

// 2. POST Stage Baru
router.post('/', authenticateToken, upload.none(), stageController.createStage);

// 3. GET Single Stage Detail (Untuk EditStage)
// 👇 UBAH: Tambahkan '/detail/' agar tidak bentrok dengan route no. 1
router.get('/detail/:id', authenticateToken, stageController.getStageById); 

// 4. PUT Update Stage
router.put('/:id', authenticateToken, upload.none(), stageController.updateStage);

// 5. DELETE Stage
router.delete('/:id', authenticateToken, stageController.deleteStage);

module.exports = router;