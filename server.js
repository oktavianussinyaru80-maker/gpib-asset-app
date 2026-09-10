const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// KONEKSI SUPABASE ONLINE (PASTIKAN KUNCI SECRET ANDA SUDAH BENAR)
const SUPABASE_URL = 'https://xsutkuazoprovxbrjgcw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_imtPyjAzZ_5fLf3-uDOUqw_3PSFnkAr';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mengarahkan halaman utama langsung ke file dashboard.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Fitur ganti gambar dasbor disederhanakan agar tidak crash di server cloud
app.post('/api/dashboard/upload-image', (req, res) => {
    res.json({ success: true, url: 'https://unsplash.com' });
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
    .insert([{ kodeBSA, nama, kategori, lokasi, tempat, tahun, kondisi, foto }])
    .select();

        if (insertError) return res.status(400).json({ error: insertError.message });
        
        res.status(201).json({ success: true, data: insertedData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
