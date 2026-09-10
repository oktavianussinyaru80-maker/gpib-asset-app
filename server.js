const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// KONEKSI SUPABASE ONLINE (MENGGUNAKAN FORMAT KUNCI BARU ANDA)
const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'sb_secret_kvjikjyNTDUXUfpfo0d9fA_sG-oOyjo';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API: Ambil data dari Supabase via Fetch Rest API
app.get('/api/assets', async (req, res) => {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/assets?select=*&order=id.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: errText });
        }
        
        const data = await response.json();
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Simpan data ke Supabase (Mendukung Format Kunci Baru)
app.post('/api/assets', async (req, res) => {
    try {
        const { kategori, lokasi, tempat, tahun, nama, kondisi, foto } = req.body;

        // Ambil data untuk menghitung nomor urut otomatis
        const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/assets?select=id`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        let count = 1;
        if (countResponse.ok) {
            const existingAssets = await countResponse.json();
            count = (existingAssets ? existingAssets.length : 0) + 1;
        }
        
        const nomorUrut = String(count).padStart(3, '0');
        const kodeBSA = `BSA-${kategori}-${lokasi}-${tempat}-${tahun}-${nomorUrut}`;
        
        const rowData = { kodeBSA, nama, kategori, lokasi, tempat, tahun, kondisi, foto };

        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/assets`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(rowData)
        });

        if (!insertResponse.ok) {
            const errText = await insertResponse.text();
            return res.status(insertResponse.status).json({ error: errText });
        }
        
        const insertedData = await insertResponse.json();
        res.status(201).json({ success: true, data: insertedData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Menghapus baris data aset di Supabase berdasarkan ID
app.delete('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(`${SUPABASE_URL}/rest/v1/assets?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: errText });
        }
        
        const data = await response.json();
        res.json({ success: true, message: 'Data terhapus.', data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
