const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// KONEKSI SUPABASE ONLINE (MENGGUNAKAN PUBLISHABLE KEY YANG SUDAH TERBUKTI AMAN)
const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'sb_publishable_dJVJ9iiDsSr6nTqMWua0FA_Dj21KC6o';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
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

// API: Simpan data ke Supabase (Kode BSA Menyesuaikan Pilihan Lokasi & Tempat)
app.post('/api/assets', async (req, res) => {
    try {
        const { kategori, lokasi, tempat, tahun, nama, kondisi } = req.body;

        // Hitung jumlah aset dengan kategori yang sama untuk nomor urut
        const { data: existingAssets, error: countError } = await supabase
            .from('assets')
            .select('id')
            .eq('kategori', kategori);

        if (countError) return res.status(400).json({ error: countError.message });

        const count = (existingAssets ? existingAssets.length : 0) + 1;
        const nomorUrut = String(count).padStart(3, '0');
        
        // KODE BSA OTOMATIS MENYESUAIKAN LOKASI DAN TEMPAT YANG DIPILIH
        const kodeBSA = `BSA-${kategori}-${lokasi}-${tempat}-${tahun}-${nomorUrut}`;
        
        const { data: insertedData, error: insertError } = await supabase
            .from('assets')
            .insert([{ kodeBSA, nama, kategori, lokasi, tempat, tahun, kondisi }])
            .select();

        if (insertError) return res.status(400).json({ error: insertError.message });
        
        res.status(201).json({ success: true, data: insertedData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Menghapus baris data aset berdasarkan ID
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

module.exports = app;
