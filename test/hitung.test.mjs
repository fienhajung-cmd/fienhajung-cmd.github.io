import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TER, KATEGORI_PTKP, tarifTER, nilaiPTKP, pajakPasal17, hitungGaji, hitungTHR, bacaAngka, formatRp,
} from '../assets/hitung.js';

test('tabel TER utuh: jumlah baris, batas naik, tarif tidak turun, berakhir 34%', () => {
  assert.deepEqual([TER.A.length, TER.B.length, TER.C.length], [44, 40, 41]);
  for (const tabel of Object.values(TER)) {
    for (let i = 1; i < tabel.length; i++) {
      assert.ok(tabel[i][0] > tabel[i - 1][0]);
      assert.ok(tabel[i][1] > tabel[i - 1][1]);
    }
    assert.equal(tabel.at(-1)[0], Infinity);
    assert.equal(tabel.at(-1)[1], 34);
  }
});

test('pemetaan PTKP ke kategori', () => {
  assert.equal(Object.keys(KATEGORI_PTKP).length, 8);
  assert.equal(tarifTER(1, 'K/0').kategori, 'A');
  assert.equal(tarifTER(1, 'TK/2').kategori, 'B');
  assert.equal(tarifTER(1, 'K/3').kategori, 'C');
});

test('batas lapisan TER: batas atas inklusif', () => {
  assert.equal(tarifTER(5_400_000, 'TK/0').persen, 0);
  assert.equal(tarifTER(5_400_001, 'TK/0').persen, 0.25);
  assert.equal(tarifTER(6_200_000, 'K/1').persen, 0);
  assert.equal(tarifTER(6_600_001, 'K/3').persen, 0.25);
  assert.equal(tarifTER(1_400_000_001, 'TK/0').persen, 34);
});

test('anomali yang tercatat di lampiran: Rp9 juta A 1,75%, B 1%, C 1,25%', () => {
  assert.equal(tarifTER(9_000_000, 'TK/0').persen, 1.75);
  assert.equal(tarifTER(9_000_000, 'K/1').persen, 1);
  assert.equal(tarifTER(9_000_000, 'K/3').persen, 1.25);
});

test('PTKP', () => {
  assert.equal(nilaiPTKP('TK/0'), 54_000_000);
  assert.equal(nilaiPTKP('K/0'), 58_500_000);
  assert.equal(nilaiPTKP('TK/3'), 67_500_000);
  assert.equal(nilaiPTKP('K/3'), 72_000_000);
  assert.throws(() => nilaiPTKP('K/4'));
});

test('Pasal 17 lintas lapisan', () => {
  assert.equal(pajakPasal17(0), 0);
  assert.equal(pajakPasal17(60_000_000), 3_000_000);
  assert.equal(pajakPasal17(61_848_000), 3_277_200);
  assert.equal(pajakPasal17(250_000_000), 31_500_000);
  assert.equal(pajakPasal17(500_000_000), 94_000_000);
  assert.equal(pajakPasal17(6_000_000_000), 1_444_000_000 + 350_000_000 - 0);
});

test('contoh hitung tangan: gaji Rp10 juta TK/0, JKK 0,24%', () => {
  const r = hitungGaji({ gajiPokok: 10_000_000, ptkp: 'TK/0' });
  assert.equal(r.perusahaan.jkk, 24_000);
  assert.equal(r.perusahaan.jkm, 30_000);
  assert.equal(r.perusahaan.kesehatan, 400_000);
  assert.equal(r.bruto, 10_454_000);
  assert.equal(r.persenTER, 2.5);
  assert.equal(r.pph21, 261_350);
  assert.equal(r.iuranKaryawan, 400_000);
  assert.equal(r.gajiBersih, 9_338_650);
  assert.equal(r.desember.biayaJabatan, 6_000_000);
  assert.equal(r.desember.pkp, 61_848_000);
  assert.equal(r.desember.pajakSetahun, 3_277_200);
  assert.equal(r.desember.pph21Desember, 402_350);
});

test('plafon BPJS Kesehatan dan JP berlaku, JHT tanpa plafon', () => {
  const r = hitungGaji({ gajiPokok: 30_000_000, ptkp: 'K/1' });
  assert.equal(r.karyawan.kesehatan, 120_000);
  assert.equal(r.perusahaan.kesehatan, 480_000);
  assert.equal(r.karyawan.jp, 110_863);
  assert.equal(r.perusahaan.jp, 221_726);
  assert.equal(r.karyawan.jht, 600_000);
});

test('tunjangan tidak tetap kena pajak tetapi bukan dasar BPJS', () => {
  const r = hitungGaji({ gajiPokok: 5_000_000, tunjanganTidakTetap: 2_000_000 });
  assert.equal(r.upah, 5_000_000);
  assert.equal(r.karyawan.jht, 100_000);
  assert.equal(r.pendapatanTunai, 7_000_000);
  assert.equal(r.bruto, 7_000_000 + 12_000 + 15_000 + 200_000);
});

test('gaji rendah: tanpa PPh 21 dan Desember tidak negatif', () => {
  const r = hitungGaji({ gajiPokok: 4_000_000, ptkp: 'TK/0' });
  assert.equal(r.pph21, 0);
  assert.equal(r.desember.pph21Desember, 0);
});

test('THR', () => {
  assert.deepEqual(hitungTHR({ upah: 6_000_000, bulanKerja: 0 }), { berhak: false, thr: 0 });
  assert.equal(hitungTHR({ upah: 6_000_000, bulanKerja: 1 }).thr, 500_000);
  assert.equal(hitungTHR({ upah: 6_000_000, bulanKerja: 6 }).thr, 3_000_000);
  assert.equal(hitungTHR({ upah: 6_000_000, bulanKerja: 12 }).thr, 6_000_000);
  assert.equal(hitungTHR({ upah: 6_000_000, bulanKerja: 60 }).thr, 6_000_000);
});

test('format dan baca angka', () => {
  assert.equal(bacaAngka('Rp 10.000.000'), 10_000_000);
  assert.equal(bacaAngka(''), 0);
  assert.equal(formatRp(-402350), '-Rp402.350');
});
