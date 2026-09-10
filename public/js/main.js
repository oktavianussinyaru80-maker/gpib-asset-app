document.addEventListener('DOMContentLoaded', () => {
    loadAssets();

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
                    // KALIMAT NOTIFIKASI BERHASIL DISIMPAN SENSASIONAL
                    alert('🎉 Data Aset Berhasil Disimpan ke Supabase Online!');
                    form.reset();
                    if(document.getElementById('tahun')) document.getElementById('tahun').value = "2026";
                    loadAssets();
                } else {
                    alert('⚠️ Gagal Menyimpan: ' + (result.error || 'Terjadi kesalahan sistem.'));
                }
            } catch (err) {
                alert('❌ Gagal terhubung ke server cloud.');
            }
        });
    }
});

async function loadAssets() {
    const container = document.getElementById('asset-list');
    if (!container) return;

    try {
        const response = await fetch('/api/assets');
        const assets = await response.json();
        container.innerHTML = '';

        let baik = 0, perbaikan = 0, rusak = 0;

        if (!assets || assets.length === 0) {
            container.innerHTML = '<p class="text-xs text-gray-400 text-center py-6">Database Online Kosong. Silakan masukkan aset perdana Anda di atas!</p>';
            return;
        }

        assets.forEach(asset => {
            if (asset.kondisi === 'Baik') baik++;
            if (asset.kondisi === 'Perlu Perbaikan') perbaikan++;
            if (asset.kondisi === 'Rusak Berat') rusak++;

            const card = document.createElement('div');
            card.className = "p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center text-xs shadow-sm mb-2";
            card.innerHTML = `
                <div style="text-align: left;">
                    <p class="font-mono text-blue-700 font-black text-[12px]">${asset.kodeBSA || 'BSA'}</p>
                    <p class="font-black text-gray-800 text-sm mt-0.5">${asset.nama || '-'}</p>
                    <p class="text-gray-400 text-[10px] mt-0.5 font-bold uppercase tracking-tight">${asset.lokasi || ''} • ${asset.tempat || ''} • Thn ${asset.tahun || ''} • [${asset.kondisi || ''}]</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="deleteAssetSecurely(${asset.id}, '${asset.nama}')" class="bg-red-50 text-red-600 border border-red-200 p-1.5 rounded-lg active:scale-95">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        if(document.getElementById('count-baik')) document.getElementById('count-baik').innerText = baik;
        if(document.getElementById('count-perbaikan')) document.getElementById('count-perbaikan').innerText = perbaikan;
        if(document.getElementById('count-rusak')) document.getElementById('count-rusak').innerText = rusak;

    } catch (err) {
        container.innerHTML = '<p class="text-xs text-red-400 text-center py-6">❌ Gagal memuat data dari internet.</p>';
    }
}

// 🔐 FUNGSI RAHASIA: TOMBOL TONG SAMPAH DENGAN PEMBATASAN PIN 1234
async function deleteAssetSecurely(id, namaBarang) {
    const pin = prompt(`⚠️ Masukkan PIN Keamanan Admin untuk menghapus "${namaBarang}":`);
    if (pin === null) return;
    
    // PEMBATASAN PIN KEAMANAN KETAT
    if (pin !== '1234') {
        alert('❌ PIN Keamanan Salah! Anda tidak diizinkan menghapus data ini.');
        return;
    }

    const setuju = confirm(`Apakah Anda yakin ingin menghapus permanen data "${namaBarang}"?`);
    if (!setuju) return;

    try {
        const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('🗑️ Data aset berhasil terhapus secara permanen.');
            loadAssets();
        }
    } catch (err) {
        alert('❌ Gagal merespon jaringan.');
    }
}
