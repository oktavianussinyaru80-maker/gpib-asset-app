const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// KONEKSI SUPABASE ONLINE (MENGGUNAKAN SECRET SERVICE ROLE KEY)
const SUPABASE_URL = 'https://xsutkuazoprovxbrjgcw.supabase.co';
const SUPABASE_KEY = 'sb_secret_qEqJlHticXfjvfL7HdCLZQ_44PTMXyS...[teks rahasia panjang Anda]';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Memastikan folder penyimpanan gambar dibuat dengan benar
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'dashboard-banner' + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.json());
// PERBAIKAN JALUR LOKASI FOLDER PUBLIC
app.use(express.static(path.join(__dirname, 'public')));

// PERBAIKAN JALUR UTAMA MENAMPILKAN DASHBOARD.HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API: Unggah gambar dasbor
app.post('/api/dashboard/upload-image', upload.single('dashboard_bg'), (req, res) => {
    if (!req.file) return res.status(400).send('Gagal mengunggah gambar.');
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// API: Ambil data dari Supabase
app.get('/api/assets', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('id', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Simpan data ke Supabase
app.post('/api/assets', async (req, res) => {
    try {
        const { kategori, lokasi, tempat, tahun, nama, kondisi } = req.body;

        const { data: existingAssets, error: countError } = await supabase
            .from('assets')
            .select('id')
            .eq('kategori', kategori);

        if (countError) return res.status(400).json({ error: countError.message });

        const count = (existingAssets ? existingAssets.length : 0) + 1;
        const nomorUrut = String(count).padStart(3, '0');
        
        const kodeBSA = `BSA-${kategori}-${lokasi}-${tempat}-${tahun}-${nomorUrut}`;
        
        const { data: insertedData, error: insertError } = await supabase
            .from('assets')
            .insert([{ kodeBSA, nama, kategori, lokasi, tempat, tahun, kondisi }]) // disesuaikan kolom tahun
            .select();

        if (insertError) return res.status(400).json({ error: insertError.message });
        
        res.status(201).json({ success: true, data: insertedData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Sistem Manajemen Aset berjalan di http://localhost:${PORT}`));
