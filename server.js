const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// KONEKSI SUPABASE ONLINE (MENGGUNAKAN SECRET SERVICE ROLE KEY)
const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'sb_secret_qEqJlHticXfjvfL7HdCLZQ_44PTMXyS...[MASUKKAN_KUNCI_SECRET_ASLI_ANDA]';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API: Ambil data dari Supabase
app.get('/api/assets', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('assets')
            .select('*');

        if (error) return res.status(400).json({ error: error.message });
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Simpan data ke Supabase (Penyelamatan Fleksibel Nama Kolom)
app.post('/api/assets', async (req, res) => {
    try {
        const { kategori, lokasi, tempat, tahun, nama, kondisi, foto } = req.body;

        // Ambil data untuk menghitung nomor urut otomatis
        const { data: existingAssets } = await supabase.from('assets').select('id');
        const count = (existingAssets ? existingAssets.length : 0) + 1;
        const nomorUrut = String(count).padStart(3, '0');
        
        const kodeGenerated = `BSA-${kategori}-${lokasi}-${tempat}-${tahun}-${nomorUrut}`;
        
        // Membuat paket data dinamis agar COCOK dengan kodeBSA maupun kode_bsa di Supabase
        const rowData = {
            nama: nama,
            kategori: kategori,
            lokasi: lokasi,
            tempat: tempat,
            tahun: tahun,
            kondisi: kondisi,
            foto: foto,
            kodeBSA: kodeGenerated,  // Jika kolom di Supabase bernama kodeBSA
            kode_bsa: kodeGenerated // Jika kolom di Supabase bernama kode_bsa
        };

        const { data: insertedData, error: insertError } = await supabase
            .from('assets')
            .insert([rowData])
            .select();

        if (insertError) {
            console.log("⚠️ ERROR SUPABASE:", insertError.message);
            return res.status(400).json({ error: insertError.message });
        }
        
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

module.exports = app;
