// Mesin hitung HitungTerbuka. Tanpa dependensi, dipakai di browser dan di tes Node.
// Setiap angka aturan ada di bagian ATURAN supaya mudah diaudit dan diperbarui.

// === ATURAN ===
export const ATURAN = {
  berlakuPer: '2026-03-01',
  kesehatan: { batasUpah: 12_000_000, karyawan: 0.01, perusahaan: 0.04 }, // Perpres 82/2018 dan perubahannya
  jht: { karyawan: 0.02, perusahaan: 0.037 }, // PP 46/2015
  jp: { batasUpah: 11_086_300, karyawan: 0.01, perusahaan: 0.02 }, // PP 45/2015, batas per Maret 2026
  jkm: 0.003, // PP 44/2015
  jkkPilihan: [0.0024, 0.0054, 0.0089, 0.0127, 0.0174], // PP 44/2015, kelompok risiko I-V
  ptkpDasar: 54_000_000,
  ptkpTambahan: 4_500_000, // kawin dan tiap tanggungan, maksimal 3 tanggungan
  biayaJabatan: { tarif: 0.05, maksimumSetahun: 6_000_000 },
  pasal17: [ // UU HPP 7/2021
    [60_000_000, 0.05],
    [250_000_000, 0.15],
    [500_000_000, 0.25],
    [5_000_000_000, 0.30],
    [Infinity, 0.35],
  ],
};

// Lampiran PP 58/2023: [batas atas inklusif, tarif dalam persen].
export const TER = {
  A: [[5400000,0],[5650000,.25],[5950000,.5],[6300000,.75],[6750000,1],[7500000,1.25],[8550000,1.5],[9650000,1.75],[10050000,2],[10350000,2.25],[10700000,2.5],[11050000,3],[11600000,3.5],[12500000,4],[13750000,5],[15100000,6],[16950000,7],[19750000,8],[24150000,9],[26450000,10],[28000000,11],[30050000,12],[32400000,13],[35400000,14],[39100000,15],[43850000,16],[47800000,17],[51400000,18],[56300000,19],[62200000,20],[68600000,21],[77500000,22],[89000000,23],[103000000,24],[125000000,25],[157000000,26],[206000000,27],[337000000,28],[454000000,29],[550000000,30],[695000000,31],[910000000,32],[1400000000,33],[Infinity,34]],
  B: [[6200000,0],[6500000,.25],[6850000,.5],[7300000,.75],[9200000,1],[10750000,1.5],[11250000,2],[11600000,2.5],[12600000,3],[13600000,4],[14950000,5],[16400000,6],[18450000,7],[21850000,8],[26000000,9],[27700000,10],[29350000,11],[31450000,12],[33950000,13],[37100000,14],[41100000,15],[45800000,16],[49500000,17],[53800000,18],[58500000,19],[64000000,20],[71000000,21],[80000000,22],[93000000,23],[109000000,24],[129000000,25],[163000000,26],[211000000,27],[374000000,28],[459000000,29],[555000000,30],[704000000,31],[957000000,32],[1405000000,33],[Infinity,34]],
  C: [[6600000,0],[6950000,.25],[7350000,.5],[7800000,.75],[8850000,1],[9800000,1.25],[10950000,1.5],[11200000,1.75],[12050000,2],[12950000,3],[14150000,4],[15550000,5],[17050000,6],[19500000,7],[22700000,8],[26600000,9],[28100000,10],[30100000,11],[32600000,12],[35400000,13],[38900000,14],[43000000,15],[47400000,16],[51200000,17],[55800000,18],[60400000,19],[66700000,20],[74500000,21],[83200000,22],[95600000,23],[110000000,24],[134000000,25],[169000000,26],[221000000,27],[390000000,28],[463000000,29],[561000000,30],[709000000,31],[965000000,32],[1419000000,33],[Infinity,34]],
};

export const KATEGORI_PTKP = {
  'TK/0': 'A', 'TK/1': 'A', 'K/0': 'A',
  'TK/2': 'B', 'TK/3': 'B', 'K/1': 'B', 'K/2': 'B',
  'K/3': 'C',
};

// === FUNGSI ===
const bulat = (n) => Math.round(n);

export function nilaiPTKP(status) {
  if (!(status in KATEGORI_PTKP)) throw new Error(`Status PTKP tidak dikenal: ${status}`);
  const [jenis, tanggungan] = status.split('/');
  const kawin = jenis === 'K' ? 1 : 0;
  return ATURAN.ptkpDasar + ATURAN.ptkpTambahan * (kawin + Number(tanggungan));
}

export function tarifTER(bruto, status) {
  const kategori = KATEGORI_PTKP[status];
  if (!kategori) throw new Error(`Status PTKP tidak dikenal: ${status}`);
  const baris = TER[kategori].find(([batas]) => bruto <= batas);
  return { kategori, persen: baris[1] };
}

export function pajakPasal17(pkp) {
  let pajak = 0;
  let bawah = 0;
  for (const [atas, tarif] of ATURAN.pasal17) {
    if (pkp <= bawah) break;
    pajak += (Math.min(pkp, atas) - bawah) * tarif;
    bawah = atas;
  }
  return bulat(pajak);
}

export function hitungGaji({
  gajiPokok = 0,
  tunjanganTetap = 0,
  tunjanganTidakTetap = 0,
  ptkp = 'TK/0',
  jkk = ATURAN.jkkPilihan[0],
}) {
  const upah = gajiPokok + tunjanganTetap;
  const { kesehatan: kes, jht, jp } = ATURAN;
  const dasarKes = Math.min(upah, kes.batasUpah);
  const dasarJP = Math.min(upah, jp.batasUpah);

  const karyawan = {
    kesehatan: bulat(dasarKes * kes.karyawan),
    jht: bulat(upah * jht.karyawan),
    jp: bulat(dasarJP * jp.karyawan),
  };
  const perusahaan = {
    kesehatan: bulat(dasarKes * kes.perusahaan),
    jht: bulat(upah * jht.perusahaan),
    jp: bulat(dasarJP * jp.perusahaan),
    jkk: bulat(upah * jkk),
    jkm: bulat(upah * ATURAN.jkm),
  };

  // Premi JKK, JKM, dan BPJS Kesehatan yang dibayar perusahaan menambah penghasilan bruto pajak.
  const pendapatanTunai = upah + tunjanganTidakTetap;
  const bruto = pendapatanTunai + perusahaan.jkk + perusahaan.jkm + perusahaan.kesehatan;
  const { kategori, persen } = tarifTER(bruto, ptkp);
  const pph21 = bulat((bruto * persen) / 100);

  const iuranKaryawan = karyawan.kesehatan + karyawan.jht + karyawan.jp;
  const iuranPerusahaan = Object.values(perusahaan).reduce((a, b) => a + b, 0);

  return {
    upah, pendapatanTunai, bruto, kategori, persenTER: persen, pph21,
    karyawan, perusahaan, iuranKaryawan, iuranPerusahaan,
    gajiBersih: pendapatanTunai - iuranKaryawan - pph21,
    biayaPerusahaan: pendapatanTunai + iuranPerusahaan,
    desember: hitungDesember({ bruto, iuranPensiun: karyawan.jht + karyawan.jp, ptkp, pph21 }),
  };
}

// Perkiraan Desember bila penghasilan sama sepanjang tahun: pajak setahun Pasal 17 dikurangi TER Januari-November.
export function hitungDesember({ bruto, iuranPensiun, ptkp, pph21 }) {
  const brutoSetahun = bruto * 12;
  const biayaJabatan = Math.min(
    bulat(brutoSetahun * ATURAN.biayaJabatan.tarif),
    ATURAN.biayaJabatan.maksimumSetahun,
  );
  const neto = brutoSetahun - biayaJabatan - iuranPensiun * 12;
  const pkp = Math.max(0, Math.floor((neto - nilaiPTKP(ptkp)) / 1000) * 1000);
  const pajakSetahun = pajakPasal17(pkp);
  const terSebelas = pph21 * 11;
  return { brutoSetahun, biayaJabatan, neto, pkp, pajakSetahun, terSebelas, pph21Desember: pajakSetahun - terSebelas };
}

// Permenaker 6/2016: masa kerja 12 bulan ke atas 1 bulan upah, 1 sampai kurang dari 12 bulan proporsional.
export function hitungTHR({ upah = 0, bulanKerja = 0 }) {
  if (bulanKerja < 1) return { berhak: false, thr: 0 };
  const bulan = Math.min(bulanKerja, 12);
  return { berhak: true, thr: bulat((upah * bulan) / 12) };
}

export const formatRp = (n, locale = 'id-ID') => {
  const minus = n < 0 ? '-' : '';
  return `${minus}Rp${Math.abs(Math.round(n)).toLocaleString(locale)}`;
};
export const bacaAngka = (teks) => Number(String(teks).replace(/\D/g, '')) || 0;
