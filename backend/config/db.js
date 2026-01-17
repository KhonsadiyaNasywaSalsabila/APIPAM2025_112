const mysql = require('mysql2');
require('dotenv').config();

// 1. Buat Pool Koneksi
const pool = mysql.createPool({
    // Sesuaikan dengan nama variabel di file .env Anda 
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    
    // PERBAIKAN DI SINI: Gunakan DB_PASS (sesuai .env), bukan DB_PASSWORD
    password: process.env.DB_PASS, 
    
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Cek Koneksi (Log agar tahu berhasil/gagal)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ FATAL ERROR: Gagal konek ke database:', err.message);
        console.error('   -> Pastikan nama variabel di .env sudah benar (DB_USER, DB_PASS, dll).');
    } else {
        console.log('✅ Berhasil terhubung ke MySQL Database!');
        connection.release();
    }
});

// 3. Export Promise
module.exports = pool.promise();