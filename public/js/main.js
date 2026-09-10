document.addEventListener('DOMContentLoaded', () => {
    loadAssets();

    const form = document.getElementById('asset-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('foto_barang');
            let fotoBase64 = "";

            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fotoBase64 = await convertFileToBase64(file);
            }

            const payload = {
                nama: document.getElementById('nama_barang').value,
                kategori: document.getElementById('kategori').value,
                lokasi: document.getElementById('lokasi').value,
                tempat: document.getElementById('tempat').value,
                tahun: parseInt(document.getElementById('tahun').value) || 2026,
                kondisi: document.getElementById('kondisi').value,
                foto: fotoBase64
            };

            try {
                const response = await fetch('/api/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (response.ok) {
                    alert('🎉 Data Aset Berhasil Disimpan Online!');
                    form.reset();
                    if(document.getElementById('tahun')) document.getElementById('tahun').value = "2026";
                    loadAssets();
                } else {
                    alert('⚠️ Gagal Menyimpan: ' + (result.error || 'Terjadi kesalahan.'));
                }
            } catch (err) {
                alert('❌ Jaringan gagal mengirim data.');
            }
        });
    }
});

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

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
            card.className = "p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between text-xs shadow-sm mb-2";
            
            const imageTag = asset.foto 
                ? `<img src="${asset.foto}" class="w-14 h-14 object-cover rounded-lg border bg-white shrink-0 shadow-sm" onclick="window.open('${asset.foto}')" style="cursor:pointer;">`
                : `<div class="w-14 h-14 bg-gray-200 border rounded-lg flex items-center justify-center text-gray-400 shrink-0"><i class="fa-solid fa-image text-lg"></i></div>`;

            card.innerHTML = `
                <div class="flex items-start space-x-3 w-full">
                    ${imageTag}
                    <div class="flex-1 min-w-0" style="text-align: left;">
                        <p class="font-mono text-blue-700 font-black text-[12px]">${asset.kodeBSA || 'BSA'}</p>
                        <p class="font-black text-gray-800 text-sm truncate mt-0.5">${asset.nama || '-'}</p>
                        <p class="text-gray-400 text-[10px] mt-0.5 font-bold uppercase tracking-tight">${asset.lokasi || ''} • ${asset.tempat || ''} • Thn ${asset.tahun || ''} • [${asset.kondisi || ''}]</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 border-t pt-2 mt-2 justify-end w-full">
                    <button onclick="openPrintModal('${asset.kodeBSA}', '${asset.nama}', '${asset.lokasi}', '${asset.tempat}', '${asset.tahun}')" class="bg-blue-900 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center space-x-1 text-[11px]">
                        <i class="fa-solid fa-qrcode text-xs"></i> <span>Label</span>
                    </button>
                    <button onclick="deleteAssetSecurely(${asset.id}, '${asset.nama}')" class="bg-red-50 text-red-600 border border-red-200 p-1.5 rounded-lg">
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

async function deleteAssetSecurely(id, namaBarang) {
    const pin = prompt(`⚠️ Masukkan PIN Keamanan Pengurus Gereja untuk menghapus "${namaBarang}":`);
    if (pin === null) return;
    if (pin !== '1234') {
        alert('❌ PIN Salah!');
        return;
    }
    const setuju = confirm(`Hapus permanen "${namaBarang}"?`);
    if (!setuju) return;

    try {
        const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('🗑️ Data terhapus.');
            loadAssets();
        }
    } catch (err) {
        alert('❌ Gagal merespon.');
    }
}

let qrInstance = null;
function openPrintModal(kodeBSA, nama, lokasi, tempat, tahun) {
    document.getElementById('modal-kode-bsa').innerText = kodeBSA;
    document.getElementById('modal-nama-barang').innerText = nama;
    document.getElementById('modal-detail-aset').innerText = `${lokasi} / ${tempat} / TAHUN ${tahun}`;
    const qrBox = document.getElementById('qrcode-box');
    qrBox.innerHTML = '';
    qrInstance = new QRCode(qrBox, {
        text: kodeBSA,
        width: 60,
        height: 60,
        colorDark: "#1e3a8a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('print-modal').classList.remove('hidden');
}

function closePrintModal() {
    document.getElementById('print-modal').classList.add('hidden');
}

function executePrintLabel() {
    const printContents = document.getElementById('label-sticker-area').innerHTML;
    document.body.innerHTML = `<div style="padding:20px; display:flex; justify-content:center; align-items:center; height:100vh;"><div style="border:2px solid #000; padding:15px; width:280px; border-radius:10px; font-family:monospace;">${printContents}</div></div>`;
    window.print();
    window.location.reload();
}
