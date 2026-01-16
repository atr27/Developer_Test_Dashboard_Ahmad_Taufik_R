# Developer Test - Reporting Dashboard

Project ini adalah solusi Full Stack untuk **Developer Test**. Aplikasi ini berupa dashboard pelaporan yang memvisualisasikan data kepatuhan (compliance) produk per area dan brand menggunakan grafik interaktif dan tabel pivot dinamis.

## Tech Stack

Sesuai dengan rekomendasi pada instruksi tes, project ini dibangun menggunakan teknologi berikut:

* **Backend:** Node.js, Express.js
* **Database:** MySQL (mysql2 driver with Promise wrapper)
* **Frontend:** Vue.js 3 (Composition API, Vite)
* **Charting:** Chart.js & vue-chartjs
* **HTTP Client:** Axios

## Prasyarat

Pastikan software berikut sudah terinstall di komputer Anda:
* Node.js (v14 atau lebih baru)
* MySQL Server (bisa menggunakan XAMPP/MAMP/Laragon)

## Setup Database

1.  Pastikan layanan MySQL berjalan.
2.  Buat database baru dengan nama `dev_test`.
3.  Import file `dev_test.sql` (disertakan dalam paket soal) ke dalam database tersebut.
4.  Konfigurasi kredensial database ada di file `backend/config/db.js`. Default setting:
    * **Host:** localhost
    * **User:** root
    * **Password:** (kosong)
    * **DB Name:** dev_test

## Cara Menjalankan Aplikasi

Project ini terdiri dari dua bagian: **Backend** dan **Frontend**. Keduanya harus dijalankan secara bersamaan.

### 1. Menjalankan Backend (API)

Buka terminal, arahkan ke folder `backend`, dan jalankan perintah berikut:

```bash
cd backend
npm install
node server.js
