const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// KONEKSI SUPABASE ONLINE (MENGGUNAKAN SECRET SERVICE ROLE KEY)
const SUPABASE_URL = 'https://xsutkuazoprovxbrjgcw.supabase.co';
const SUPABASE_KEY = 'sb_secret_qEqJ1hTiCxfjvfL7HdCLZQ_44PTMXyS';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.json());
// Memastikan jalur desain dibaca dengan kuat di server cloud
app.use(express.static(path.join(__dirname, 'public')));

// Mengarahkan halaman utama langsung ke file dashboard.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API: Ambil data dari Supabase
app.get('/api/assets', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('id', { ascending: false });

        if (error) return res.status(400).json({ error: error.message });
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Simpan data ke Supabase (Mendukung kolm foto baru)
app.post('/api/assets', async (req, res) => {
    try {
        const { kategori, lokasi, tempat, tahun, nama, kondisi, foto } = req.body;

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
            .insert([{ kodeBSA, nama, kategori, lokasi, tempat, tahun, kondisi, foto }])
            .select();

        if (insertError) return res.status(400).json({ error: insertError.message });
        
        res.status(201).json({ success: true, data: insertedData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Menghapus baris data aset di Supabase berdasarkan ID
app.delete('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id)
            .select();

        if (error) return res.status(400).json({ error: error.message });
        res.json({ success: true, message: 'Data terhapus.', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BARIS INI YANG PALING PENTING AGAR VERCEL BISA MEMBACA DESAIN WEB ANDA
module.exports = app;
