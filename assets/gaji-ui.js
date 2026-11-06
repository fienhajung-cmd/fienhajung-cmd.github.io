import { hitungGaji, formatRp, bacaAngka } from './hitung.js';

const TEKS = {
  id: {
    locale: 'id-ID', bersih: 'Gaji bersih Januari-November, per bulan',
    potongan: 'Potongan dari gaji Anda', pendapatan: 'Pendapatan tunai', kes: 'BPJS Kesehatan (1%)',
    jht: 'JHT (2%)', jp: 'Jaminan Pensiun (1%)', pph: (k, p) => `PPh 21 TER kategori ${k} (${String(p).replace('.', ',')}%)`,
    bersihBaris: 'Gaji bersih', perusahaanJudul: 'Biaya tambahan perusahaan', ppKes: 'BPJS Kesehatan (4%)',
    ppJht: 'JHT (3,7%)', ppJp: 'Jaminan Pensiun (2%)', ppJkk: 'JKK', ppJkm: 'JKM (0,3%)', ppTotal: 'Total biaya perusahaan per bulan',
    desJudul: 'Perkiraan PPh 21 Desember', desBruto: 'Bruto setahun', desBj: 'Biaya jabatan', desPkp: 'Penghasilan kena pajak',
    desPajak: 'Pajak setahun (Pasal 17)', desTer: 'Sudah dipotong Januari-November', desAkhir: 'PPh 21 Desember',
    desLebih: 'Hasil negatif berarti ada lebih potong yang dikembalikan atau diperhitungkan pemberi kerja.',
  },
  en: {
    locale: 'en-US', bersih: 'Take-home pay January-November, per month',
    potongan: 'Deducted from your pay', pendapatan: 'Cash earnings', kes: 'BPJS Health (1%)',
    jht: 'Old-age savings, JHT (2%)', jp: 'Pension, JP (1%)', pph: (k, p) => `PPh 21 TER category ${k} (${p}%)`,
    bersihBaris: 'Take-home pay', perusahaanJudul: 'Additional employer cost', ppKes: 'BPJS Health (4%)',
    ppJht: 'JHT (3.7%)', ppJp: 'Pension, JP (2%)', ppJkk: 'Work accident, JKK', ppJkm: 'Death benefit, JKM (0.3%)', ppTotal: 'Total monthly employer cost',
    desJudul: 'Estimated December PPh 21', desBruto: 'Annual gross', desBj: 'Occupational deduction', desPkp: 'Taxable income',
    desPajak: 'Annual tax (Article 17)', desTer: 'Withheld January-November', desAkhir: 'December PPh 21',
    desLebih: 'A negative result means an overpayment that the employer refunds or offsets.',
  },
};

const t = TEKS[document.documentElement.lang] ?? TEKS.id;
const form = document.querySelector('#form-gaji');
const keluaran = document.querySelector('#hasil');
const rp = (n) => formatRp(n, t.locale);

const baris = (label, nilai, kelas = '') => {
  const tr = document.createElement('tr');
  if (kelas) tr.className = kelas;
  const a = document.createElement('td');
  a.textContent = label;
  const b = document.createElement('td');
  b.className = 'n';
  b.textContent = rp(nilai);
  tr.append(a, b);
  return tr;
};

const tabel = (judul, isi, catatan) => {
  const h = document.createElement('h3');
  h.textContent = judul;
  const tb = document.createElement('table');
  tb.append(...isi);
  const hasil = [h, tb];
  if (catatan) {
    const p = document.createElement('p');
    p.className = 'lead';
    p.textContent = catatan;
    hasil.push(p);
  }
  return hasil;
};

function render() {
  const data = new FormData(form);
  const r = hitungGaji({
    gajiPokok: bacaAngka(data.get('pokok')),
    tunjanganTetap: bacaAngka(data.get('tetap')),
    tunjanganTidakTetap: bacaAngka(data.get('tidakTetap')),
    ptkp: data.get('ptkp'),
    jkk: Number(data.get('jkk')),
  });
  const d = r.desember;
  const utama = document.createElement('div');
  utama.className = 'hasil-utama';
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = t.bersih;
  const nilai = document.createElement('span');
  nilai.className = 'nilai';
  nilai.textContent = rp(r.gajiBersih);
  utama.append(label, nilai);

  keluaran.replaceChildren(
    utama,
    ...tabel(t.potongan, [
      baris(t.pendapatan, r.pendapatanTunai),
      baris(t.kes, -r.karyawan.kesehatan),
      baris(t.jht, -r.karyawan.jht),
      baris(t.jp, -r.karyawan.jp),
      baris(t.pph(r.kategori, r.persenTER), -r.pph21),
      baris(t.bersihBaris, r.gajiBersih, 'total'),
    ]),
    ...tabel(t.desJudul, [
      baris(t.desBruto, d.brutoSetahun),
      baris(t.desBj, -d.biayaJabatan),
      baris(t.desPkp, d.pkp),
      baris(t.desPajak, d.pajakSetahun),
      baris(t.desTer, -d.terSebelas),
      baris(t.desAkhir, d.pph21Desember, 'total'),
    ], d.pph21Desember < 0 ? t.desLebih : ''),
    ...tabel(t.perusahaanJudul, [
      baris(t.ppKes, r.perusahaan.kesehatan),
      baris(t.ppJht, r.perusahaan.jht),
      baris(t.ppJp, r.perusahaan.jp),
      baris(t.ppJkk, r.perusahaan.jkk),
      baris(t.ppJkm, r.perusahaan.jkm),
      baris(t.ppTotal, r.biayaPerusahaan, 'total'),
    ]),
  );
}

form.addEventListener('input', (e) => {
  if (e.target.inputMode === 'numeric') {
    const n = bacaAngka(e.target.value);
    e.target.value = n ? n.toLocaleString(t.locale) : '';
  }
  render();
});
form.addEventListener('submit', (e) => e.preventDefault());
render();
