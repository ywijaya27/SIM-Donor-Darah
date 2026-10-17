// Komunikasi ke backend Google Apps Script (REST/JSON). Tidak memakai google.script.run.
// POST wajib 'text/plain' agar browser tidak mengirim preflight CORS yang ditolak GAS.
async function kirim(fn, a) {
  if (!GAS_URL || /GANTI/.test(GAS_URL)) throw new Error('GAS_URL belum diisi di js/config.js');
  const publik = fn === 'beranda' || fn === 'kegiatanPublik'; // data publik: GET (lebih cepat, bisa di-cache browser)
  const r = publik
    ? await fetch(GAS_URL + '?action=' + fn)
    : await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: fn, data: a }) });
  if (!r.ok) throw new Error('Server tidak merespons (' + r.status + ')');
  return r.json();
}
