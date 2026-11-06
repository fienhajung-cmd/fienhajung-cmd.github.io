import { hitungTHR, formatRp, bacaAngka } from './hitung.js';

const form = document.querySelector('#form-thr');
const nilai = document.querySelector('#thr-nilai');
const penjelasan = document.querySelector('#thr-penjelasan');

function render() {
  const data = new FormData(form);
  const upah = bacaAngka(data.get('upah'));
  const bulanKerja = bacaAngka(data.get('bulan'));
  const r = hitungTHR({ upah, bulanKerja });
  nilai.textContent = formatRp(r.thr);
  if (!r.berhak) penjelasan.textContent = 'Masa kerja di bawah 1 bulan belum berhak atas THR.';
  else if (bulanKerja >= 12) penjelasan.textContent = 'Masa kerja 12 bulan atau lebih: THR sebesar 1 bulan upah.';
  else penjelasan.textContent = `Proporsional: ${bulanKerja} / 12 x ${formatRp(upah)}.`;
}

form.addEventListener('input', (e) => {
  if (e.target.name === 'upah') {
    const n = bacaAngka(e.target.value);
    e.target.value = n ? n.toLocaleString('id-ID') : '';
  }
  render();
});
form.addEventListener('submit', (e) => e.preventDefault());
render();
