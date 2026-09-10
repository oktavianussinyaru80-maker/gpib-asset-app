document.addEventListener('DOMContentLoaded', () => {
    // Jalankan fungsi muat data pertama kali halaman dibuka
    loadAssets();

    // 1. Fitur Kirim Data Entri Aset dari HP ke Server Laptop
    const form = document.getElementById('asset-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                nama: document.getElementById('nama_barang').value,
                kategori: document.getElementById('kategori').value,
                lokasi: document.getElementById('lokasi').value,
                tempat: document.getElementById('tempat').value,
                tahun: parseInt(document.getElementById('tahun').value) || 2026,
                kondisi: document.getElementById('kondisi').value
            };

            try {
                const response = await fetch('/api/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('🎉 Data Aset Berhasil Disimpan ke Supabase Online!');
                    form.reset();
                    if(document.getElementById('tahun')) document.getElementById('tahun').value = "2026";
                    loadAssets(); // Muat ulang daftar register di layar bawah
                } else {
                    alert('⚠️ Gagal Menyimpan: ' + (result.error || 'Terjadi kesalahan sistem.'));
                }
            } catch (err) {
                alert('❌ Server Laptop Tidak Merespon. Pastikan server node tetap menyala.');
                console.error(err);
            }
        });
    }
});

// 2. Fungsi Utama Mengambil Data dari Server dan Memajangnya di HP
async function loadAssets() {
    const container = document.getElementById('asset-list');
    if (!container) return;

    try {
        const response = await fetch('/api/assets');
        if (!response.ok) throw new Error('Gagal mengambil data dari server.');
        
        const assets = await response.json();
        container.innerHTML = '';

        let baik = 0, perbaikan = 0, rusak = 0;

        // Jika database di internet masih kosong
        if (!assets || assets.length === 0) {
            container.innerHTML = '<p class="text-xs text-gray-400 text-center py-6">Database Online Kosong. Silakan masukkan aset perdana Anda di atas!</p>';
            return;
        }

        // Tampilkan data baris demi baris ke HP jika ada data
        assets.forEach(asset => {
            if (asset.kondisi === 'Baik') baik++;
            if (asset.kondisi === 'Perlu Perbaikan') perbaikan++;
            if (asset.kondisi === 'Rusak Berat') rusak++;

            const card = document.createElement('div');
            card.className = "p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs shadow-sm mb-2";
            card.innerHTML = `
                <div>
                    <p class="font-mono text-blue-700 font-bold">${asset.kodeBSA || 'BSA-UNKNOWN'}</p>
                    <p class="font-semibold text-gray-800 text-sm mt-0.5">${asset.nama || '-'}</p>
                    <p class="text-gray-400 text-[10px] mt-0.5">${asset.lokasi || ''} • ${asset.tempat || ''} • Thn ${asset.tahun || ''}</p>
                </div>
                <span class="px-2 py-1 rounded-md font-bold text-[10px] ${
                    asset.kondisi === 'Baik' ? 'bg-green-100 text-green-700' : 
                    asset.kondisi === 'Perlu Perbaikan' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }">${asset.kondisi || 'Baik'}</span>
            `;
            container.appendChild(card);
        });

        // Update papan angka di atas
        if(document.getElementById('count-baik')) document.getElementById('count-baik').innerText = baik;
        if(document.getElementById('count-perbaikan')) document.getElementById('count-perbaikan').innerText = perbaikan;
        if(document.getElementById('count-rusak')) document.getElementById('count-rusak').innerText = rusak;

    } catch (err) {
        container.innerHTML = '<p class="text-xs text-red-400 text-center py-6">❌ Gagal terhubung ke Server Laptop Anda.</p>';
    }
}
