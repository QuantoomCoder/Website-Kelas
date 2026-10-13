WEBSITE KELAS X RPL

STRUKTUR FILE
- index.html : struktur halaman
- style.css  : desain, warna, layout desktop dan mobile
- script.js  : tombol, data siswa/event, upload foto, dialog, dan penyimpanan browser

CARA MENJALANKAN
1. Simpan ketiga file di folder yang sama.
2. Buka index.html dengan browser; atau jalankan server lokal dari folder ini:
   python3 -m http.server 8080
3. Buka http://localhost:8080

FITUR
- Menu navigasi responsive untuk desktop dan mobile.
- Tambah, edit, dan hapus siswa.
- Tambah, edit, dan hapus event.
- Ubah profil dan foto wali kelas.
- Upload foto kelas dan foto galeri, edit keterangan, dan hapus slot foto.
- Edit pengumuman.
- Perubahan dan foto disimpan di localStorage browser pada perangkat yang sama.

CATATAN PENTING
Ini masih website front-end statis. localStorage hanya menyimpan perubahan di browser/perangkat yang digunakan; data tidak otomatis dibagikan ke teman sekelas. Untuk sinkronisasi online lintas perangkat dibutuhkan hosting dan backend/database.
