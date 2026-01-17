// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const questRoutes = require('./routes/questRoutes');
const stageRoutes = require('./routes/stageRoutes');   // ✅ Fitur Admin Stage
const rewardRoutes = require('./routes/rewardRoutes'); // ✅ Fitur Admin Reward
const apiRoutes = require('./routes/apiRoutes');       // ✅ Jalur Khusus Android/Mobile

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- STATIC FOLDER ---
// Akses gambar: http://localhost:5000/uploads/nama_file.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- SETUP ROUTE ---

// 1. AUTHENTICATION (Login & Register)
app.use('/api/auth', authRoutes); 

// 2. MOBILE API GATEWAY (Pintu Depan untuk Android)
// Menangani: /api/users/profile, /api/quests (public), /api/passports
app.use('/api', apiRoutes); 

// 👇 TAMBAHKAN BARIS INI UNTUK MOBILE REWARDS
// Agar Android bisa akses /api/rewards/my-rewards
app.use('/api/rewards', rewardRoutes);

// 3. ADMIN PANEL ROUTES (Pintu Belakang untuk Web Admin)
// CRUD Data (Create, Update, Delete)
app.use('/api/admin/quests', questRoutes); 
app.use('/api/admin/stages', stageRoutes);
app.use('/api/admin/rewards', rewardRoutes);


// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Format JSON tidak valid' });
    }
    next();
});

// --- ROOT CHECK ---
app.get('/', (req, res) => {
    res.send('✅ Server NusantaraQuest Berjalan!');
});

// --- JALANKAN SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Server berjalan di port ${PORT}`);
    console.log(`📂 Static folder: http://localhost:${PORT}/uploads`);
    console.log(`-----------------------------------------`);
    console.log(`🔗 Auth API:    http://localhost:${PORT}/api/auth`);
    console.log(`📱 Mobile API:  http://localhost:${PORT}/api`);
    console.log(`🛠️  Admin API:   http://localhost:${PORT}/api/admin/quests`);
    console.log(`=========================================`);
});