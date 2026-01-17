const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        
        // 1. Coba ambil ekstensi dari nama file asli (misal: .mp3)
        let ext = path.extname(file.originalname);

        // 2. JIKA EKSTENSI KOSONG (Kasus file temp Android 'upload_xxx'),
        // Tentukan ekstensi manual berdasarkan Mime Type
        if (!ext || ext === '.') {
            if (file.mimetype === 'audio/mpeg') ext = '.mp3';
            else if (file.mimetype === 'audio/wav') ext = '.wav';
            else if (file.mimetype === 'image/jpeg') ext = '.jpg';
            else if (file.mimetype === 'image/png') ext = '.png';
            else if (file.mimetype === 'application/pdf') ext = '.pdf';
            // Default jika tidak dikenali
            else ext = ''; 
        }

        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    // Daftar tipe dokumen yang diizinkan
    const allowedDocs = [
        'application/pdf',                                                        // .pdf
        'text/plain',                                                             // .txt
        'application/msword',                                                     // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];

    if (
        file.mimetype.startsWith('image/') || // Bolehkan semua gambar
        file.mimetype.startsWith('audio/') || // Bolehkan semua audio
        allowedDocs.includes(file.mimetype)   // Bolehkan dokumen di atas
    ) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung! Hanya Gambar, Audio, PDF, Word, dan Txt.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Batas 10MB
});

module.exports = upload;